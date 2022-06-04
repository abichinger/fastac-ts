import matchit from 'matchit';
import { regexMatcher } from './matchers';

export function pathMatch(path: string, pattern: string): boolean {
  let pathPattern = matchit.parse(pattern);
  let match = matchit.match(path, [pathPattern]);
  return match.length > 0;
}

export function regexMatch(str: string, pattern: string): boolean {
  return regexMatcher.match(str, regexMatcher.parse(pattern));
}
