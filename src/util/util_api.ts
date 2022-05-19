
export interface IPatternMatcher {
    isPattern(str: string): boolean
    match(str:string, pattern:string): boolean
}