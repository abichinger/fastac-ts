import { IPatternMatcher } from "../../util"


let fns: Map<string, (...args: any[]) => any> = new Map()

export function setFunction(name: string, fn: (...args: any[]) => any) {
    fns.set(name, fn)
}

export function removeFunction(name: string) {
    fns.delete(name)
}

export function getFunctions(): any {
    return Object.fromEntries(fns.entries())
}

let matchers: Map<string, IPatternMatcher> = new Map()

export function setPatternMatcher(name: string, matcher: IPatternMatcher) {
    matchers.set(name, matcher)
}

export function removePatternMatcher(name: string) {
    matchers.delete(name)
}

export function getPatternMatcher(name: string): IPatternMatcher | undefined {
    return matchers.get(name)
}