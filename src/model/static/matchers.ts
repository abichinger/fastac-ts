import { IPatternMatcher } from '.';

export class PrefixMatcher implements IPatternMatcher {
  private prefix: string;
  private parseFn: (pattern: string) => any;
  private matchFn: (str: string, pattern: any) => boolean;
  private cache: Map<string, any> = new Map();

  constructor(
    prefix: string,
    parseFn: (pattern: string) => any,
    matchFn: (str: string, pattern: any) => boolean
  ) {
    this.prefix = prefix;
    this.parseFn = parseFn;
    this.matchFn = matchFn;
  }

  isPattern(str: string): boolean {
    return str.startsWith(this.prefix);
  }

  parse(pattern: string): any {
    let p = this.cache.get(pattern);
    if (p === undefined) {
      p = this.parseFn(pattern.substring(this.prefix.length));
      this.cache.set(pattern, p);
    }
    return p;
  }

  match(str: string, pattern: any): boolean {
    return this.matchFn(str, pattern);
  }
}

let regexMatcher = new PrefixMatcher(
  `r'`,
  pattern => {
    return new RegExp(pattern);
  },
  (str, pattern) => {
    let m = str.match(pattern as RegExp);
    return m !== null;
  }
);

export { regexMatcher };
