import { IAddRuleBool } from '../api';
import { ISimpleAdapter } from './storage_api';

export class NoopAdapter implements ISimpleAdapter {
  loadPolicy(_model: IAddRuleBool): void {
    return;
  }
  savePolicy(_model: Iterable<string[]>): void {
    return;
  }
  addRule(_rule: string[]): void {
    return;
  }
  removeRule(_rule: string[]): void {
    return;
  }
}
