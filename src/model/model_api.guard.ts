/*
 * Generated type guards for "model_api.ts".
 * WARNING: Do not manually change this file.
 */
import { IModel } from './model_api';

export function isModel(obj: any, _argumentName?: string): obj is IModel {
  return (
    ((obj !== null && typeof obj === 'object') || typeof obj === 'function') &&
    typeof obj.addRule === 'function' &&
    ((obj !== null && typeof obj === 'object') || typeof obj === 'function') &&
    typeof obj.removeRule === 'function' &&
    typeof obj.on === 'function' &&
    typeof obj.once === 'function' &&
    typeof obj.off === 'function' &&
    typeof obj.emit === 'function' &&
    typeof obj.registerDef === 'function' &&
    typeof obj.getDef === 'function' &&
    typeof obj.setDef === 'function' &&
    typeof obj.removeDef === 'function' &&
    typeof obj.get === 'function' &&
    typeof obj.toString === 'function'
  );
}
