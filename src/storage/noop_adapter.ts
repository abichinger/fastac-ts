import { IAddRuleBool } from '../api';
import { ISimpleAdapter } from './storage_api';

export class NoopAdapter implements ISimpleAdapter {
  async loadPolicy(_model: IAddRuleBool): Promise<void> {
    return;
  }
  async savePolicy(_model: Iterable<string[]>): Promise<void> {
    return;
  }
  async addRule(_rule: string[]): Promise<void> {
    return;
  }
  async removeRule(_rule: string[]): Promise<void> {
    return;
  }
}
