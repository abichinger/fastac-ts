/*
 * Generated type guards for "matcher_api.ts".
 * WARNING: Do not manually change this file.
 */
import { IMatcher } from './matcher_api';

export function isMatcher(obj: any, _argumentName?: string): obj is IMatcher {
  return (
    ((obj !== null && typeof obj === 'object') || typeof obj === 'function') &&
    typeof obj.rangeMatches === 'function'
  );
}
