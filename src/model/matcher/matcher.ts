import { hash } from '../../util';
import { ParameterDef } from '../def';
import { IPolicy } from '../policy/policy_api';
import { MatcherStage } from './def';
import { IMatcher } from './matcher_api';
import evaluate from 'static-eval';
import { getFunctions } from '../static';

class MatcherNode {
  rule: string[];
  children: Map<string, MatcherNode>[];

  constructor(rule: string[]) {
    this.rule = rule;
    let left = new Map<string, MatcherNode>();
    let right = new Map<string, MatcherNode>();
    this.children = [left, right];
  }

  getOrCreate(i: number, key: string, rule: string[]): MatcherNode {
    let node = this.children[i].get(key);
    if (node !== undefined) {
      return node;
    }
    node = new MatcherNode(rule);
    this.children[i].set(key, node);
    return node;
  }
}

export class Matcher implements IMatcher {
  exprRoot: MatcherStage;
  policy?: IPolicy;
  pDef: ParameterDef;
  rDef: ParameterDef;
  root: MatcherNode = new MatcherNode([]);
  enabled: boolean = false;

  constructor(
    rDef: ParameterDef,
    pDef: ParameterDef,
    policy: IPolicy | undefined,
    exprRoot: MatcherStage
  ) {
    this.exprRoot = exprRoot;
    this.policy = policy;
    this.rDef = rDef;
    this.pDef = pDef;

    this.enable();
  }

  getPolicyDef(): ParameterDef {
    return this.pDef;
  }

  clear() {
    this.root = new MatcherNode([]);
  }

  enable() {
    if (this.policy === undefined || this.enabled) {
      return;
    }

    this.clear();

    for (let rule of this.policy) {
      this.addRule(rule);
    }

    this.policy.on('rule_added', this.addRule.bind(this));
    this.policy.on('rule_deleted', this.removeRule.bind(this));
    this.policy.on('cleared', this.clear);

    this.enabled = true;
  }

  disable() {
    if (this.policy === undefined || !this.enable) {
      return;
    }

    this.policy.off('rule_added', this.addRule.bind(this));
    this.policy.off('rule_deleted', this.removeRule.bind(this));
    this.policy.off('cleared', this.clear);

    this.enabled = false;
  }

  private addRule(rule: any[]) {
    this.addRuleHelper(rule, this.exprRoot, this.root);
  }

  private addRuleHelper(
    rule: any[],
    exprNode: MatcherStage,
    node: MatcherNode
  ) {
    for (let [i, nextExpr] of exprNode.children.entries()) {
      let pArgs = nextExpr.pArgs;

      let key: string;
      if (pArgs.length === 0 || nextExpr.isLeafNode()) {
        key = hash(rule);
      } else {
        let r = this.pDef.getArray(rule, pArgs);
        key = hash(r);
      }

      if (!nextExpr.isLeafNode()) {
        let nextNode = node.getOrCreate(i, key, rule);
        this.addRuleHelper(rule, nextExpr, nextNode);
      } else {
        node.children[i].set(key, new MatcherNode(rule));
      }
    }
  }

  private removeRule(rule: any[]) {
    this.removeRuleHelper(rule, this.exprRoot, this.root);
  }

  private removeRuleHelper(
    rule: any[],
    exprNode: MatcherStage,
    node: MatcherNode
  ) {
    for (let [i, nextExpr] of exprNode.children.entries()) {
      let pArgs = nextExpr.pArgs;

      let key: string;
      if (pArgs.length === 0 || nextExpr.isLeafNode()) {
        key = hash(rule);
      } else {
        let r = this.pDef.getArray(rule, pArgs);
        key = hash(r);
      }

      if (!nextExpr.isLeafNode()) {
        let nextNode = node.children[i].get(key);
        if (nextNode !== undefined) {
          this.removeRuleHelper(rule, nextExpr, nextNode);
        }
      } else {
        node.children[i].delete(key);
      }
    }
  }

  private eachMatchingNode(
    exprNode: MatcherStage,
    rules: Map<string, MatcherNode>,
    vars: any,
    fn: (node: MatcherNode) => boolean
  ): boolean {
    if (rules.size === 0) {
      let empty_rule = new Array(this.pDef.params.length).fill('');
      rules = new Map([['', new MatcherNode(empty_rule)]]);
    }

    for (let child of rules.values()) {
      let allVars = this.pDef.toObject(child.rule);
      Object.assign(allVars, vars);

      let res = evaluate(exprNode.ast, allVars);
      if (res === undefined) {
        throw new Error(
          `can't resolve ${exprNode.expr} with ${JSON.stringify(
            Object.keys(allVars)
          )}`
        );
      }
      if (typeof res === 'boolean' && res && !fn(child)) {
        return false;
      }
    }
    return true;
  }

  private eachMatchHelper(
    exprNode: MatcherStage,
    node: MatcherNode,
    vars: any,
    fn: (rule: string[]) => boolean
  ): boolean {
    for (let [i, nextExpr] of exprNode.children.entries()) {
      let cont = this.eachMatchingNode(
        nextExpr,
        node.children[i],
        vars,
        nextNode => {
          if (nextExpr.isLeafNode() && !fn(nextNode.rule)) {
            return false; //break
          }
          let cont = this.eachMatchHelper(nextExpr, nextNode, vars, fn);
          if (!cont) {
            return false;
          }
          return true; //continue
        }
      );
      if (!cont) {
        return false;
      }
    }
    return true;
  }

  /**
   * eachMatch executes a provided function for each matched rule
   * @param vars request values and functions from FunctionMap
   * @param fn callback function
   */
  eachMatch(req: any[], fn: (rule: string[]) => boolean): void {
    let vars = this.rDef.toObject(req);
    Object.assign(vars, getFunctions());
    this.eachMatchHelper(this.exprRoot, this.root, vars, fn);
  }
}
