import { IAddRuleBool, IRemoveRuleBool } from '../api';
import { DefHandler } from './handlers';

export enum Sec {
  R = 'request_definition',
  P = 'policy_definition',
  G = 'role_definition',
  J = 'judge_definiton',
  M = 'matchers',
}

/** @see {isModel} ts-auto-guard:type-guard */
export interface IModel extends IAddRuleBool, IRemoveRuleBool {
  on<E extends keyof IModelEvents>(event: E, listener: IModelEvents[E]): this;

  once<E extends keyof IModelEvents>(event: E, listener: IModelEvents[E]): this;

  off<E extends keyof IModelEvents>(event: E, listener: IModelEvents[E]): this;

  emit<E extends keyof IModelEvents>(
    event: E,
    ...args: Parameters<IModelEvents[E]>
  ): boolean;

  registerDef(sec: string, keyPrefix: string, handler: DefHandler<any>): void;
  getDef(sec: string, key: string): string | undefined;
  setDef(sec: string, key: string, value: string): void;
  removeDef(sec: string, key: string): void;

  get<T>(sec: string, key: string): T | undefined;

  toString(): string;
}

export interface IModelEvents {
  rule_added: (rule: string[]) => void;
  rule_deleted: (rule: string[]) => void;
  model_loaded: () => void;
}
