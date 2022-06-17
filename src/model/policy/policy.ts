import { IPolicy } from './policy_api';
import { EventEmitter } from 'events';
import { hash } from '../../util';
import { ParameterDef } from '../def';

export class Policy extends EventEmitter implements IPolicy {
  rules: Map<string, any[]>;
  def: ParameterDef;

  constructor(key: string, parameters: string) {
    super();
    this.rules = new Map();
    this.def = new ParameterDef(key, parameters);
  }

  addRule(rule: any[]): boolean {
    this.def.check(rule);

    let key = hash(rule);
    if (this.rules.has(key)) {
      return false;
    }
    this.rules.set(key, rule);
    this.emit('rule_added', rule);
    return true;
  }
  removeRule(rule: any[]): boolean {
    let key = hash(rule);
    if (!this.rules.has(key)) {
      return false;
    }
    this.rules.delete(key);
    this.emit('rule_deleted', rule);
    return true;
  }
  clear(): void {
    this.rules = new Map();
    this.emit('cleared');
  }
  [Symbol.iterator](): Iterator<any[], any, undefined> {
    return this.rules.values();
  }

  parameters(): ParameterDef {
    return this.def;
  }
}
