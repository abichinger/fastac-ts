import { IAddRawRuleBool, IAddRuleBool, IRemoveRuleBool } from '../api';
import { ExtensionEntry, RetType } from './model_ext';
import { Rule } from './policy/policy_api';

export enum Sec {
  R = 'request_definition',
  P = 'policy_definition',
  G = 'role_definition',
  J = 'judge_definiton',
  M = 'matchers',
}

/** @see {isModel} ts-auto-guard:type-guard */
export interface IModel extends IAddRuleBool, IAddRawRuleBool, IRemoveRuleBool {
  on<E extends keyof IModelEvents>(event: E, listener: IModelEvents[E]): this;

  once<E extends keyof IModelEvents>(event: E, listener: IModelEvents[E]): this;

  off<E extends keyof IModelEvents>(event: E, listener: IModelEvents[E]): this;

  emit<E extends keyof IModelEvents>(
    event: E,
    ...args: Parameters<IModelEvents[E]>
  ): boolean;

  registerExt(ext: ExtensionEntry): void;
  getDef(sec: string, key: string): string | undefined;
  setDef(sec: string, key: string, value: string): void;
  removeDef(sec: string, key: string): void;

  get<T>(type: RetType, key: string): T | undefined;

  eachRule(fn: (rule: string[]) => boolean): void;
  toString(): string;
}

export interface IModelEvents {
  rule_added: (rule: Rule) => void;
  rule_deleted: (rule: Rule) => void;
  model_loaded: () => void;
}
