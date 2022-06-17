export interface IAddRuleBool {
  addRule(rule: any[]): boolean;
}

export interface IAddRawRuleBool {
  addRawRule(rule: string[]): boolean;
}

export interface IAddRule {
  addRule(rule: any[]): void;
}

export interface IAddRules {
  addRules(rules: any[][]): void;
}

export interface IRemoveRuleBool {
  removeRule(rule: any[]): boolean;
}

export interface IRemoveRule {
  removeRule(rule: any[]): void;
}

export interface IRemoveRules {
  removeRules(rules: any[][]): void;
}

export interface IClear {
  clear(): void;
}
