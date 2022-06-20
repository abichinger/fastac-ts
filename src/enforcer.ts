import { BaseConfig, EnforceConfig, getJudgeF, getMatcher } from './config';
import { EnforcerOptions, IEnforcer } from './enforcer_api';
import { Effect, Judgement } from './model/judge/judge_api';
import { Model } from './model/model';
import { IModel } from './model/model_api';
import { isModel } from './model/model_api.guard';
import { IStorageAdapter } from './storage/storage_api';
import { StorageController } from './storage/controller';
import { NoopAdapter } from './storage/noop_adapter';
import { isStorageAdapter } from './storage/storage_api.guard';

export class Enforcer implements IEnforcer {
  private model: IModel;
  private adapter: IStorageAdapter;
  private sc: StorageController;
  //private options: EnforcerOptions;

  constructor(
    model?: string | IModel,
    adapter?: string | IStorageAdapter,
    options: EnforcerOptions = { autosave: false, storage: false }
  ) {
    if (isModel(model)) {
      this.model = model;
    } else if (typeof model === 'string') {
      this.model = Model.fromFile(model);
    } else {
      this.model = new Model();
    }

    if (isStorageAdapter(adapter)) {
      this.adapter = adapter;
    } else if (typeof adapter === 'string' && adapter.endsWith('.csv')) {
      if (process.env.ENV_TYPE === 'node') {
        const { CSVAdapter } = require('./storage/csv_adapter');
        this.adapter = new CSVAdapter(adapter);
      } else {
        throw new Error('CSVAdapter is not supported in browser');
      }
    } else if (typeof adapter === 'string' && adapter.endsWith('.json')) {
      if (process.env.ENV_TYPE === 'node') {
        const { JSONAdapter } = require('./storage/json_adapter');
        this.adapter = new JSONAdapter(adapter);
      } else {
        throw new Error('JSONAdapter is not supported in browser');
      }
    } else {
      this.adapter = new NoopAdapter();
    }

    this.sc = new StorageController(this.model, this.adapter, options);
    //this.options = options;
  }

  async loadPolicy() {
    let enabled = this.sc.enabled();
    if (enabled) {
      this.sc.disable();
    }
    let p = this.adapter.load(this.model);
    p.then(() => {
      if (enabled) {
        this.sc.enable();
      }
    });
    return p;
  }

  async flush() {
    return this.sc.flush();
  }

  getModel(): IModel {
    return this.model;
  }

  setModel(_model: IModel): void {
    throw new Error('Method not implemented.');
  }

  addRule(rule: any[]): boolean {
    return this.model.addRule(rule);
  }

  addRules(rules: any[][]): void {
    let autosave = this.sc.autosave();
    if (autosave) {
      this.sc.setAutosave(false);
    }
    for (let rule of rules) {
      this.model.addRule(rule);
    }
    if (autosave) {
      this.flush();
      this.sc.setAutosave(true);
    }
  }

  removeRule(rule: any[]): boolean {
    return this.model.removeRule(rule);
  }

  removeRules(rules: any[][]): void {
    let autosave = this.sc.autosave();
    if (autosave) {
      this.sc.setAutosave(false);
    }
    for (let rule of rules) {
      this.model.removeRule(rule);
    }
    if (autosave) {
      this.flush();
      this.sc.setAutosave(true);
    }
  }

  enforce(config: EnforceConfig): boolean {
    let { req = [], matcher = 'm', judge = 'j' } = config;
    let m = getMatcher(this.model, matcher);
    let j = getJudgeF(this.model, judge).getJudge(m.getPolicy().def());
    let res: Judgement = {
      effect: Effect.Indeterminate,
    };

    m.eachMatch(req, rule => {
      res = j.eval(rule);
      if (res.effect !== Effect.Indeterminate) {
        return false;
      }
      return true; //continue
    });

    return res.effect === Effect.Allow;
  }

  filter(config: BaseConfig): any[][] {
    let { req = [], matcher = 'm' } = config;
    let m = getMatcher(this.model, matcher);
    let policy = m.getPolicy();
    if (policy === undefined) {
      return [];
    }

    let pKey = policy.def().key;
    let rules: any[][] = [];
    m.eachMatch(req, rule => {
      let r = Array.from(rule);
      r.unshift(pKey);
      rules.push(r);
      return true;
    });

    return rules;
  }

  eachMatch(_config: BaseConfig, _cb: (rule: any[]) => boolean): void {
    throw new Error('Method not implemented.');
  }
}
