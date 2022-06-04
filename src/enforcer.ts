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
    } else if (typeof adapter === 'string') {
      const { FileAdapter } = require('./storage/file_adapter');
      this.adapter = new FileAdapter(adapter);
    } else {
      this.adapter = new NoopAdapter();
    }
    this.adapter.loadPolicy(this.model);

    this.sc = new StorageController(this.model, this.adapter, options);
    //this.options = options;
  }

  getModel(): IModel {
    return this.model;
  }

  setModel(_model: IModel): void {
    throw new Error('Method not implemented.');
  }

  addRule(rule: string[]): boolean {
    return this.model.addRule(rule);
  }

  addRules(rules: string[][]): void {
    let autosave = this.sc.autosave();
    if (autosave) {
      this.sc.setAutosave(false);
    }
    for (let rule of rules) {
      this.model.addRule(rule);
    }
    if (autosave) {
      this.sc.setAutosave(true);
    }
  }

  removeRule(rule: string[]): boolean {
    return this.model.removeRule(rule);
  }

  removeRules(rules: string[][]): void {
    let autosave = this.sc.autosave();
    if (autosave) {
      this.sc.setAutosave(false);
    }
    for (let rule of rules) {
      this.model.removeRule(rule);
    }
    if (autosave) {
      this.sc.setAutosave(true);
    }
  }

  enforce(config: EnforceConfig): boolean {
    let { req = [], matcher = 'm', judge = 'j' } = config;
    let m = getMatcher(this.model, matcher);
    let j = getJudgeF(this.model, judge).getJudge(m.getPolicyDef());
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

  filter(_config: BaseConfig): string[][] {
    throw new Error('Method not implemented.');
  }

  eachMatch(_config: BaseConfig, _cb: (rule: string[]) => boolean): void {
    throw new Error('Method not implemented.');
  }
}
