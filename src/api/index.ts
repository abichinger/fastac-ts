export interface IAddRuleBool {
  addRule(rule: string[]): boolean;
}

export interface IAddRule {
  addRule(rule: string[]): void;
}

export interface IAddRules {
  addRules(rules: string[][]): void;
}

export interface IRemoveRuleBool {
  removeRule(rule: string[]): boolean;
}

export interface IRemoveRule {
  removeRule(rule: string[]): void;
}

export interface IRemoveRules {
  removeRules(rules: string[][]): void;
}

export interface IClear {
  clear(): void;
}
