import { IAddRuleBool } from '../api';
import { ISimpleAdapter } from './storage_api';
import fs from 'fs';
import { Policy } from '../model/policy';

const sep = ',';

function ruleToLine(rule: string[]): string {
  return rule.join(sep + ' ') + '\n';
}

function lineToRule(line: string): string[] {
  if (line === '' || line.startsWith('#')) {
    return [];
  }
  let i = line.indexOf('#');
  line = i >= 0 ? line.substring(0, i) : line;
  return line.split(sep).map(a => a.trim());
}

export class CSVAdapter implements ISimpleAdapter {
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  async loadPolicy(model: IAddRuleBool): Promise<void> {
    let content = await fs.promises.readFile(this.path, 'utf-8');
    let lines = content.split('\n');
    for (let line of lines) {
      let rule = lineToRule(line);
      if (rule.length === 0) {
        continue;
      }
      model.addRule(rule);
    }
  }

  async savePolicy(rules: Iterable<string[]>): Promise<void> {
    let content = '';
    for (let rule of rules) {
      let line = ruleToLine(rule);
      content += line + '\n';
    }
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
