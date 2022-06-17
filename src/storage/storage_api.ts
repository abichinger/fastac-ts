import { IAddRawRuleBool } from '../api';

export interface LoadOptions {
  filter: any;
}

/** @see {isStorageAdapter} ts-auto-guard:type-guard */
export interface IStorageAdapter {
  load(model: IAddRawRuleBool, options?: LoadOptions): Promise<void>;
  clear(): Promise<void>;
}

export interface ISimpleAdapter extends IStorageAdapter {
  addRule(rule: string[]): Promise<void>;
  removeRule(rule: string[]): Promise<void>;
}

export interface IBatchAdapter extends IStorageAdapter {
  addRules(rules: string[][]): Promise<void>;
  removeRules(rules: string[][]): Promise<void>;
}

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
