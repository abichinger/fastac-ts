import { IModel } from '../model/model_api';
import { Rule } from '../model/policy/policy_api';
import {
  IBatchAdapter,
  isBatchAdapter,
  ISimpleAdapter,
  isSimpleAdapter,
  IStorageAdapter,
} from './storage_api';

export interface StorageOptions {
  autosave: boolean;
  storage: boolean;
}

enum OpCode {
  Add = 0,
  Remove,
}

interface Operation {
  opc: OpCode;
  rule: string[];
}

async function runBatch(
  adapter: IBatchAdapter,
  opc: OpCode,
  rules: string[][]
) {
  if (opc === OpCode.Add) {
    await adapter.addRules(rules);
  } else if (opc === OpCode.Remove) {
    await adapter.removeRules(rules);
  }
}

export class StorageController {
  private options: StorageOptions;
  private model: IModel;
  private adapter: IStorageAdapter;
  private q: Operation[] = [];
  private pending: Promise<void> | undefined;

  constructor(
    model: IModel,
    adapter: IStorageAdapter,
    options: StorageOptions
  ) {
    this.model = model;
    this.adapter = adapter;
    this.options = options;

    if (options.storage) {
      this.options.storage = false;
      this.enable();
    }
  }

  autosave(): boolean {
    return this.options.autosave;
  }

  setAutosave(autosave: boolean) {
    this.options.autosave = autosave;
  }

  private onRuleAdded(rule: Rule): void {
    this.addOp(OpCode.Add, rule.def.stringify(rule.values));
  }

  private onRuleRemoved(rule: Rule): void {
    this.addOp(OpCode.Remove, rule.def.stringify(rule.values));
  }

  addOp(opc: OpCode, rule: string[]) {
    this.q.unshift({ opc, rule });
    if (this.options.autosave) {
      this.flush();
    }
  }

  flush(): Promise<void> {
    let p = this._flush();
    this.pending = p;
    return p;
  }

  enabled(): boolean {
    return this.options.storage;
  }

  enable(): void {
    if (this.enabled()) {
      return;
    }

    this.model.on('rule_added', this.onRuleAdded.bind(this));
    this.model.on('rule_deleted', this.onRuleRemoved.bind(this));
    this.options.storage = true;
  }

  disable(): void {
    if (!this.enabled()) {
      return;
    }

    this.model.off('rule_added', this.onRuleAdded.bind(this));
    this.model.off('rule_deleted', this.onRuleRemoved.bind(this));
    this.options.storage = false;
  }

  private async simpleFlush(adapter: ISimpleAdapter) {
    let op = this.q.pop();
    while (op !== undefined) {
      if (op.opc === OpCode.Add) {
        await adapter.addRule(op.rule);
      } else if (op.opc === OpCode.Remove) {
        await adapter.removeRule(op.rule);
      }
      op = this.q.pop();
    }
  }

  private async batchFlush(adapter: IBatchAdapter) {
    let rules: string[][] = [];

    let op = this.q.pop();
    if (op === undefined) {
      return;
    }
    let currentOpc = op.opc;

    while (op !== undefined) {
      if (currentOpc === op.opc) {
        rules.push(op.rule);
      } else {
        await runBatch(adapter, currentOpc, rules);
        currentOpc = op.opc;
        rules = [op.rule];
      }

      op = this.q.pop();
    }

    if (rules.length > 0) {
      await runBatch(adapter, currentOpc, rules);
    }
  }

  private async _flush() {
    //wait until previous flush is finished
    if (this.pending) {
      await this.pending;
    }

    if (isBatchAdapter(this.adapter)) {
      await this.batchFlush(this.adapter);
    } else if (isSimpleAdapter(this.adapter)) {
      await this.simpleFlush(this.adapter);
    } else {
      throw new Error('invalid adapter');
    }
  }
}
