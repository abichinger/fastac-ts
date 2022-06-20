import { IAddRawRuleBool } from '../api';
import { IBatchAdapter } from './storage_api';
import fs from 'fs';
import { RuleSet } from './json_adapter';

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

export class CSVAdapter implements IBatchAdapter {
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  async load(model: IAddRawRuleBool): Promise<void> {
    if (!fs.existsSync(this.path)) {
      return;
    }
    let content = await fs.promises.readFile(this.path, 'utf-8');
    let lines = content.split('\n');
    for (let line of lines) {
      let rule = lineToRule(line);
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
    let content = '';
    for (let rule of rules) {
      let line = ruleToLine(rule);
      content += line + '\n';
    }
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
