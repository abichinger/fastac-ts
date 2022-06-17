import { IModel, Sec } from './model_api';
import { EventEmitter } from 'events';
import { getBaseKey, getProperty } from '../util';
import {
  DefHandler,
  GenericHandler,
  JudgeHandler,
  MatcherHandler,
  PolicyHandler,
  RoleManagerHandler,
} from './handlers';

import ini from 'ini';
import { IPolicy } from './policy/policy_api';

class Section {
  name: string;
  defs: Map<string, string>;
  handlers: Map<string, DefHandler<any>>;

  constructor(name: string) {
    this.name = name;
    this.defs = new Map();
    this.handlers = new Map();
  }

  register(baseKey: string, handler: DefHandler<any>): void {
    this.handlers.set(baseKey, handler);
  }

  set(model: IModel, key: string, value: string) {
    let baseKey = getBaseKey(key);
    let handler = this.handlers.get(baseKey);
    if (handler === undefined) {
      throw new Error(`no def handler found for '${key}'`);
    }
    let property = getProperty(key);
    if (property === undefined) {
      handler.add(model, key, value);
    } else {
      let parent = key.substring(0, key.length - property.length - 1);
      handler.prop(parent, property, value);
    }
    this.defs.set(key, value);
  }

  remove(model: IModel, key: string) {
    let baseKey = getBaseKey(key);
    let handler = this.handlers.get(baseKey);
    if (handler === undefined) {
      throw new Error(`no def handler found for '${key}'`);
    }
    handler.remove(model, key);
    this.defs.delete(key);
  }

  get<T>(key: string): T | undefined {
    let baseKey = getBaseKey(key);
    let handler = this.handlers.get(baseKey);
    if (handler === undefined) {
      return undefined;
    }
    return (handler as DefHandler<T>).get(key);
  }

  entries<T>(baseKey: string): IterableIterator<[string, T]> {
    let handler = this.handlers.get(baseKey);
    if (handler === undefined) {
      return [].values();
    }
    return (handler as DefHandler<T>).entries();
  }

  getDef(key: string): string | undefined {
    return this.defs.get(key);
  }
}

export class Model extends EventEmitter implements IModel {
  private secMap: Map<string, Section>;

  constructor() {
    super();
    this.secMap = new Map();

    this.registerDef(Sec.R, 'r', new GenericHandler());
    this.registerDef(Sec.P, 'p', new PolicyHandler());
    this.registerDef(Sec.G, 'g', new RoleManagerHandler());
    this.registerDef(Sec.J, 'j', new JudgeHandler());
    this.registerDef(Sec.M, 'm', new MatcherHandler());
  }

  registerDef(sec: string, keyPrefix: string, handler: DefHandler<any>): void {
    let section = this.secMap.get(sec);
    if (section === undefined) {
      section = new Section(sec);
      this.secMap.set(sec, section);
    }
    section.register(keyPrefix, handler);
  }

  get<T>(sec: string, key: string): T | undefined {
    let section = this.secMap.get(sec);
    if (section === undefined) {
      throw new Error(`section "${sec}" not found`);
    }
    return section.get<T>(key);
  }

  entries<T>(sec: string, baseKey: string): IterableIterator<[string, T]> {
    let section = this.secMap.get(sec);
    if (section === undefined) {
      throw new Error(`section "${sec}" not found`);
    }
    return section.entries<T>(baseKey);
  }

  setDef(sec: string, key: string, value: string): void {
    let section = this.secMap.get(sec);
    if (section === undefined) {
      throw new Error(`section "${sec}" not found`);
    }
    section.set(this, key, value);
  }

  getDef(sec: string, key: string): string | undefined {
    let section = this.secMap.get(sec);
    if (section === undefined) {
      throw new Error(`section "${sec}" not found`);
    }
    return section.getDef(key);
  }

  removeDef(sec: string, key: string): void {
    let section = this.secMap.get(sec);
    if (section === undefined) {
      throw new Error(`section "${sec}" not found`);
    }
    section.remove(this, key);
  }

  getPolicy(pKey: string): IPolicy | undefined {
    let policy = this.get<IPolicy>(Sec.P, pKey);
    return policy ? policy : this.get<IPolicy>(Sec.G, pKey);
  }

  addRawRule(rule: string[]) {
    let pKey = rule[0];
    let policy = this.getPolicy(pKey);
    if (policy === undefined) {
      throw new Error(`policy '${pKey}' not found`);
    }
    let pDef = policy.parameters();
    let parsed = pDef.parse(rule.slice(1));
    parsed.unshift(pKey);
    return this.addRule(parsed);
  }

  addRule(rule: any[]): boolean {
    let pKey = rule[0];
    let policy = this.getPolicy(pKey);
    if (policy === undefined) {
      throw new Error(`policy '${pKey}' not found`);
    }
    let added = policy.addRule(rule.slice(1));
    if (added) {
      this.emit('rule_added', rule);
    }
    return added;
  }
  removeRule(rule: any[]): boolean {
    let pKey = rule[0];
    let policy = this.getPolicy(pKey);
    if (policy === undefined) {
      throw new Error(`policy '${pKey}' not found`);
    }
    let deleted = policy.removeRule(rule.slice(1));
    if (deleted) {
      this.emit('rule_deleted', rule);
    }
    return deleted;
  }

  toString(): string {
    let obj: any = {};
    for (let [secName, sec] of this.secMap.entries()) {
      let secObj: any = {};
      obj[secName] = secObj;
      for (let [key, value] of sec.defs.entries()) {
        secObj[key] = value;
      }
    }
    return ini.stringify(obj, { whitespace: true });
  }

  static fromFile(path: string): Model {
    if (process.env.ENV_TYPE === 'node') {
      const fs = require('fs');
      let config = fs.readFileSync(path, 'utf-8');
      return this.fromText(config);
    } else {
      throw new Error('fromFile can only be called from a node.js environment');
    }
  }

  static fromText(config: string): Model {
    let model = new Model();
    let cfg = ini.parse(config);
    for (let secName of Object.values(Sec)) {
      if (cfg[secName] === undefined || typeof cfg[secName] !== 'object') {
        continue;
      }
      for (let [key, value] of Object.entries(cfg[secName])) {
        model.setDef(secName, key, value as string);
      }
    }
    return model;
  }

  eachRule(fn: (rule: string[]) => boolean): void {
    let policies = this.entries<IPolicy>(Sec.P, 'p');
    let rolePolicies = this.entries<IPolicy>(Sec.G, 'g');
    let policyMap = new Map([
      ...Array.from(policies),
      ...Array.from(rolePolicies),
    ]);
    for (let [key, policy] of policyMap.entries()) {
      for (let rule of policy) {
        let cont = fn([key, ...rule]);
        if (!cont) {
          return;
        }
      }
    }
  }
}
