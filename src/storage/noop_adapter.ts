import { IAddRawRuleBool } from '../api';
import { ISimpleAdapter, LoadOptions } from './storage_api';

export class NoopAdapter implements ISimpleAdapter {
  async load(_model: IAddRawRuleBool, _options: LoadOptions): Promise<void> {
    return;
  }
  async clear(): Promise<void> {
    return;
  }
  async addRule(_rule: string[]): Promise<void> {
    return;
  }
  async removeRule(_rule: string[]): Promise<void> {
    return;
  }
}
