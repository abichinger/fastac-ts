import { BaseConfig, EnforceConfig } from './config';
import { IModel } from './model/model_api';
import { StorageOptions } from './storage/controller';

export interface EnforcerOptions extends StorageOptions {}

export interface IEnforcer {
  getModel(): IModel;
  setModel(model: IModel): void;

  addRule(rule: any[]): boolean;
  addRules(rules: any[][]): void;
  removeRule(rule: any[]): boolean;
  removeRules(rules: any[][]): void;

  enforce(config: EnforceConfig): boolean;
  filter(config: BaseConfig): any[][];
  eachMatch(config: BaseConfig, cb: (rule: any[]) => boolean): void;
}
