import { IModel } from '../model/model_api';
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

function runBatch(adapter: IBatchAdapter, opc: OpCode, rules: string[][]) {
  if (opc === OpCode.Add) {
    adapter.addRules(rules);
  } else if (opc === OpCode.Remove) {
    adapter.removeRules(rules);
  }
}

export class StorageController {
  private options: StorageOptions;
  private model: IModel;
  private adapter: IStorageAdapter;
  private q: Operation[] = [];
  private wait: number = 1;

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

  private onRuleAdded(rule: string[]): void {
    this.addOp(OpCode.Add, rule);
  }

  private onRuleRemoved(rule: string[]): void {
    this.addOp(OpCode.Remove, rule);
  }

  addOp(opc: OpCode, rule: string[]) {
    this.q.unshift({ opc, rule });
    if (!this.options.autosave) {
      return;
    }
    this.wait--;
    if (this.wait <= 0) {
      this.flush();
    }
  }

  enabled(): boolean {
    return this.options.storage;
  }

  enable(): void {
    if (this.enabled()) {
      return;
    }

    this.model.on('rule_added', this.onRuleAdded);
    this.model.on('rule_deleted', this.onRuleRemoved);
    this.options.storage = true;
  }

  disable(): void {
    if (!this.enabled()) {
      return;
    }

    this.model.off('rule_added', this.onRuleAdded);
    this.model.off('rule_deleted', this.onRuleRemoved);
    this.options.storage = false;
  }

  private simpleFlush(adapter: ISimpleAdapter): void {
    let op = this.q.pop();
    while (op !== undefined) {
      if (op.opc === OpCode.Add) {
        adapter.addRule(op.rule);
      } else if (op.opc === OpCode.Remove) {
        adapter.removeRule(op.rule);
      }
      op = this.q.pop();
    }
  }

  private batchFlush(adapter: IBatchAdapter): void {
    let rules: string[][] = [];

    let op = this.q.pop();
    if (op === undefined) {
      return;
    }
    let currentOpc = op.opc;

    while (op !== undefined) {
      if (currentOpc === op.opc) {
        rules.push(op.rule);
        continue;
      } else {
        runBatch(adapter, currentOpc, rules);
        currentOpc = op.opc;
        rules = [op.rule];
      }

      op = this.q.pop();
    }

    if (rules.length > 0) {
      runBatch(adapter, currentOpc, rules);
    }
  }

  flush(): void {
    if (isBatchAdapter(this.adapter)) {
      this.batchFlush(this.adapter);
    } else if (isSimpleAdapter(this.adapter)) {
      this.simpleFlush(this.adapter);
    } else {
      throw new Error('invalid adapter');
    }

    this.wait = 0;
  }

  addWait(i: number): void {
    this.wait += i;
  }
}
