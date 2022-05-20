export interface IMatcher {
  rangeMatches(req: any[], fn: (rule: string[]) => boolean): void;
}
