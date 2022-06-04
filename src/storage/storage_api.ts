import {
  IAddRule,
  IAddRuleBool,
  IAddRules,
  IRemoveRule,
  IRemoveRules,
} from '../api';

/** @see {isStorageAdapter} ts-auto-guard:type-guard */
export interface IStorageAdapter {
  loadPolicy(model: IAddRuleBool): void;
  savePolicy(model: Iterable<string[]>): void;
}

export interface ISimpleAdapter
  extends IStorageAdapter,
    IAddRule,
    IRemoveRule {}

export interface IBatchAdapter
  extends IStorageAdapter,
    IAddRules,
    IRemoveRules {}

export function isSimpleAdapter(adapter: any): adapter is ISimpleAdapter {
  return (
    typeof adapter.addRule === 'function' &&
    typeof adapter.removeRule === 'function'
  );
}

export function isBatchAdapter(adapter: any): adapter is IBatchAdapter {
  return (
    typeof adapter.addRules === 'function' &&
    typeof adapter.removeRules === 'function'
  );
}
