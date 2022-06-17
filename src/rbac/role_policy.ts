import { Policy } from '../model/policy';
import { IRoleManager } from './rbac_api';

export class RolePolicy extends Policy {
  rm: IRoleManager;

  constructor(rm: IRoleManager, key: string, parameters: string) {
    super(key, parameters);
    this.rm = rm;
  }

  addRule(rule: string[]): boolean {
    this.rm.addLink(rule[0], rule[1], ...rule.slice(2));
    return super.addRule(rule);
  }

  removeRule(rule: string[]): boolean {
    this.rm.deleteLink(rule[0], rule[1], ...rule.slice(2));
    return super.removeRule(rule);
  }

  clear() {
    this.rm.clear();
    super.clear();
  }
}
