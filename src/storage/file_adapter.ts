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

export class FileAdapter implements ISimpleAdapter {
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  loadPolicy(model: IAddRuleBool): void {
    let content = fs.readFileSync(this.path, 'utf-8');
    let lines = content.split('\n');
    for (let line of lines) {
      let rule = lineToRule(line);
      if (rule.length === 0) {
        continue;
      }
      model.addRule(rule);
    }
  }

  savePolicy(rules: Iterable<string[]>): void {
    let content = '';
    for (let rule of rules) {
      let line = ruleToLine(rule);
      content += line + '\n';
    }
    fs.writeFileSync(this.path, content);
  }

  addRule(rule: string[]): void {
    let rules = new Policy();
    this.loadPolicy(rules);
    rules.addRule(rule);
    this.savePolicy(rules);
  }

  removeRule(rule: string[]): void {
    let rules = new Policy();
    this.loadPolicy(rules);
    rules.removeRule(rule);
    this.savePolicy(rules);
  }
}
