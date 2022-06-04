const defaultSep = ',';

export function hash(rule: string[]): string {
  return rule.join(defaultSep);
}

export function getBaseKey(key: string): string {
  let m = key.match(/^[a-zA-Z]+/g);
  if (m === null) {
    throw new Error('key must start with a letter');
  }
  return m[0];
}

export function getProperty(identifier: string): string | undefined {
  let index = identifier.indexOf('.');
  if (index === -1) {
    return;
  }
  return identifier.substring(index + 1);
}
