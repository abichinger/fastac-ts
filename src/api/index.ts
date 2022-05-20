export interface IAddRuleBool {
  addRule(rule: string[]): boolean;
}

export interface IRemoveRuleBool {
  removeRule(rule: string[]): boolean;
}

export interface IClear {
  clear(): void;
}
