import { IAddRuleBool } from '../api';
import { ISimpleAdapter } from './storage_api';
import fs from 'fs';
import { Policy } from '../model/policy';

export class JSONAdapter implements ISimpleAdapter {
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  async loadPolicy(model: IAddRuleBool): Promise<void> {
    let content = await fs.promises.readFile(this.path, 'utf-8');
    let rules = JSON.parse(content);
    for (let rule of rules) {
      if (rule.length === 0) {
        continue;
      }
      model.addRule(rule);
    }
  }

  async savePolicy(rules: Iterable<string[]>): Promise<void> {
    let content = JSON.stringify(rules);
    await fs.promises.writeFile(this.path, content);
  }

  async addRule(rule: string[]): Promise<void> {
    let rules = new Policy();
    await this.loadPolicy(rules);
    rules.addRule(rule);
    await this.savePolicy(rules);
  }

  async removeRule(rule: string[]): Promise<void> {
    let rules = new Policy();
    await this.loadPolicy(rules);
    rules.removeRule(rule);
    await this.savePolicy(rules);
  }
}
