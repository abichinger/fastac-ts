/*
 * Generated type guards for "storage_api.ts".
 * WARNING: Do not manually change this file.
 */
import { IStorageAdapter } from './storage_api';

export function isStorageAdapter(
  obj: any,
  _argumentName?: string
): obj is IStorageAdapter {
  return (
    ((obj !== null && typeof obj === 'object') || typeof obj === 'function') &&
    typeof obj.loadPolicy === 'function' &&
    typeof obj.savePolicy === 'function'
  );
}
