import { IAddRuleBool, IRemoveRuleBool, IClear } from '../../api';
import { hash } from '../../util';
import { ParameterDef } from '../def';

export interface IPolicyEvents {
  rule_added: (rule: string[]) => void;
  rule_deleted: (rule: string[]) => void;
  cleared: () => void;
}

export interface IPolicy
  extends IAddRuleBool,
    IRemoveRuleBool,
    IClear,
    Iterable<string[]> {
  on<E extends keyof IPolicyEvents>(event: E, listener: IPolicyEvents[E]): this;

  once<E extends keyof IPolicyEvents>(
    event: E,
    listener: IPolicyEvents[E]
  ): this;

  off<E extends keyof IPolicyEvents>(
    event: E,
    listener: IPolicyEvents[E]
  ): this;

  emit<E extends keyof IPolicyEvents>(
    event: E,
    ...args: Parameters<IPolicyEvents[E]>
  ): boolean;

  parameters(): ParameterDef;
}

export function getDistinct(p: IPolicy, columns: number[]): string[][] {
  let resMap = new Map<string, string[]>();
  for (let rule of p) {
    let values: string[] = [];
    for (let i = 0; i < columns.length; i++) {
      values[i] = rule[columns[i]];
    }
    resMap.set(hash(values), values);
  }
  return Array.from(resMap.values());
}
