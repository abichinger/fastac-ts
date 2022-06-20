import { IModel, Sec } from './model_api';
import { EventEmitter } from 'events';
import { getBaseKey, getProperty } from '../util';
import {
  ModelExtension,
  extensions,
  ExtensionEntry,
  RetType,
} from './model_ext';

import ini from 'ini';
import { IPolicy } from './policy/policy_api';
import { ParameterDef } from './def';

class Section {
  name: string;
  defs: Map<string, string>;
  handlers: Map<string, ModelExtension<any>>;

  constructor(name: string) {
    this.name = name;
    this.defs = new Map();
    this.handlers = new Map();
  }

  register(baseKey: string, handler: ModelExtension<any>): void {
    if (this.handlers.has(baseKey)) {
      throw new Error(`base key ${baseKey} already in use`);
    }
    this.handlers.set(baseKey, handler);
  }

  set(model: IModel, key: string, value: string) {
    let baseKey = getBaseKey(key);
    let handler = this.handlers.get(baseKey);
    if (handler === undefined) {
      throw new Error(`no model extension found for '${baseKey}'`);
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
      throw new Error(`no model extension found for '${baseKey}'`);
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
    return (handler as ModelExtension<T>).get(key);
  }

  entries<T>(): IterableIterator<[string, T]> {
    let res: [string, T][] = [];
    for (let handler of this.handlers.values()) {
      let instances = Array.from((handler as ModelExtension<T>).entries());
      res.push(...instances);
    }
    return res.values();
  }

  getDef(key: string): string | undefined {
    return this.defs.get(key);
  }
}

export class Model extends EventEmitter implements IModel {
  private secMap: Map<string, Section>;
  private typeMap: Map<RetType, Section>;

  constructor() {
    super();
    this.secMap = new Map();
    this.typeMap = new Map();

    for (let entry of extensions) {
      this.registerExt(entry);
    }
  }

  registerExt(ext: ExtensionEntry): void {
    let section = this.secMap.get(ext.sec);
    if (section === undefined) {
      section = new Section(ext.sec);
      this.secMap.set(ext.sec, section);
    }
    let handler = new ext.ext();
    section.register(ext.key, handler);

    let typeSec = this.typeMap.get(handler.type());
    if (typeSec === undefined) {
      typeSec = new Section(handler.type());
      this.typeMap.set(handler.type(), typeSec);
    }
    typeSec.register(ext.key, handler);
  }

  get<T>(type: RetType, key: string): T | undefined {
    let section = this.typeMap.get(type);
    if (section === undefined) {
      return undefined;
    }
    return section.get<T>(key);
  }

  entries<T>(type: RetType): IterableIterator<[string, T]> {
    let section = this.typeMap.get(type);
    if (section === undefined) {
      return [].values();
    }
    return section.entries<T>();
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

  getRequestDef(rKey: string): ParameterDef | undefined {
    return this.get<ParameterDef>(RetType.Param, rKey);
  }

  getPolicy(pKey: string): IPolicy | undefined {
    return this.get<IPolicy>(RetType.Policy, pKey);
  }

  addRawRule(rule: string[]) {
    let pKey = rule[0];
    let policy = this.getPolicy(pKey);
    if (policy === undefined) {
      throw new Error(`policy '${pKey}' not found`);
    }
    let pDef = policy.def();
    let parsed = pDef.parse(rule);
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
      this.emit('rule_added', { values: rule, def: policy.def() });
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
      this.emit('rule_deleted', { values: rule, def: policy.def() });
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

  eachRule(fn: (rule: any[]) => boolean): void {
    let policies = this.entries<IPolicy>(RetType.Policy);
    for (let [key, policy] of policies) {
      for (let rule of policy) {
        let cont = fn([key, ...rule]);
        if (!cont) {
          return;
        }
      }
    }
  }
}
