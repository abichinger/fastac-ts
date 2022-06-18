import { IAddRawRuleBool } from '../api';
import { IBatchAdapter } from './storage_api';
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

export class JSONAdapter implements IBatchAdapter {
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  async load(model: IAddRawRuleBool): Promise<void> {
    if (!fs.existsSync(this.path)) {
      return;
    }
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

  async addRules(rules: string[][]): Promise<void> {
    let rs = new RuleSet();
    await this.load(rs);
    for (let rule of rules) {
      rs.addRawRule(rule);
    }
    await this.savePolicy(rs);
  }

  async removeRules(rules: string[][]): Promise<void> {
    let rs = new RuleSet();
    await this.load(rs);
    for (let rule of rules) {
      rs.removeRawRule(rule);
    }
    await this.savePolicy(rs);
  }
}
