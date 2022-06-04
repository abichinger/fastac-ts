import { BaseConfig, EnforceConfig } from './config';
import { IModel } from './model/model_api';
import { StorageOptions } from './storage/controller';

export interface EnforcerOptions extends StorageOptions {}

export interface IEnforcer {
  getModel(): IModel;
  setModel(model: IModel): void;

  addRule(rule: string[]): boolean;
  addRules(rules: string[][]): void;
  removeRule(rule: string[]): boolean;
  removeRules(rules: string[][]): void;

  enforce(config: EnforceConfig): boolean;
  filter(config: BaseConfig): string[][];
  eachMatch(config: BaseConfig, cb: (rule: string[]) => boolean): void;
}
