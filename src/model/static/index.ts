import { pathMatch, regexMatch } from './functions';
import { regexMatcher } from './matchers';

type Func = (...args: any[]) => any;

interface FuncMap {
  [index: string]: Func;
}

let fns: Map<string, Func> = new Map();

export function setFunction(name: string, fn: Func) {
  fns.set(name, fn);
}

export function removeFunction(name: string) {
  fns.delete(name);
}

export function getFunctions(): FuncMap {
  return Object.fromEntries(fns.entries());
}

setFunction('pathMatch', pathMatch);
setFunction('regexMatch', regexMatch);

export interface IPatternMatcher {
  isPattern(str: string): boolean;
  parse(pattern: string): any;
  match(str: string, pattern: any): boolean;
}

let matchers: Map<string, IPatternMatcher> = new Map();

export function setPatternMatcher(name: string, matcher: IPatternMatcher) {
  matchers.set(name, matcher);
}

export function removePatternMatcher(name: string) {
  matchers.delete(name);
}

export function getPatternMatcher(name: string): IPatternMatcher | undefined {
  return matchers.get(name);
}

setPatternMatcher('RegexMatcher', regexMatcher);
