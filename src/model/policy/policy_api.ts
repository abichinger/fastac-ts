import { IAddRuleBool, IRemoveRuleBool, IClear } from '../../api';
import { hash } from '../../util';
import { ParameterDef } from '../def';

export interface Rule {
  values: any[];
  def: ParameterDef;
}

export interface IPolicyEvents {
  rule_added: (rule: Rule) => void;
  rule_deleted: (rule: Rule) => void;
  cleared: () => void;
}

export interface IPolicy
  extends IAddRuleBool,
    IRemoveRuleBool,
    IClear,
    Iterable<any[]> {
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

  def(): ParameterDef;
}

export function getDistinct(p: IPolicy, columns: number[]): any[][] {
  let resMap = new Map<string, any[]>();
  for (let rule of p) {
    let values: any[] = [];
    for (let i = 0; i < columns.length; i++) {
      values[i] = rule[columns[i]];
    }
    resMap.set(hash(values), values);
  }
  return Array.from(resMap.values());
}
