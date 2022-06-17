import { IAddRawRuleBool } from '../api';
import { ISimpleAdapter } from './storage_api';
import fs from 'fs';

export class RuleSet implements IAddRawRuleBool, Iterable<string[]> {
  rules: Set<string>;

  constructor() {
    this.rules = new Set();
  }

  addRawRule(rule: string[]): boolean {
    let value = rule.join(',');
    if (this.rules.has(value)) {
      return false;
    }
    this.rules.add(value);
    return true;
  }

  removeRawRule(rule: string[]): boolean {
    let value = rule.join(',');
    if (!this.rules.has(value)) {
      return false;
    }
    this.rules.delete(value);
    return true;
  }

  [Symbol.iterator](): Iterator<any[], any, undefined> {
    return Array.from(this.rules.values())
      .map(rule => rule.split(','))
      .values();
  }
}

export class JSONAdapter implements ISimpleAdapter {
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  async load(model: IAddRawRuleBool): Promise<void> {
    let content = await fs.promises.readFile(this.path, 'utf-8');
    let rules = JSON.parse(content);
    for (let rule of rules) {
      if (rule.length === 0) {
        continue;
      }
      model.addRawRule(rule);
    }
  }

  async clear(): Promise<void> {
    await this.savePolicy([[]]);
  }

  async savePolicy(rules: Iterable<string[]>): Promise<void> {
    let arr = Array.from(rules);
    let content = JSON.stringify(arr);
    await fs.promises.writeFile(this.path, content);
  }

  async addRule(rule: string[]): Promise<void> {
    let rules = new RuleSet();
    await this.load(rules);
    rules.addRawRule(rule);
    await this.savePolicy(rules);
  }

  async removeRule(rule: string[]): Promise<void> {
    let rules = new RuleSet();
    await this.load(rules);
    rules.removeRawRule(rule);
    await this.savePolicy(rules);
  }
}
