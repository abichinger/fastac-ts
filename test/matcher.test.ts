import { buildIndex, MatcherStage, Matcher } from '../src/model/matcher';
import { ParameterDef } from '../src/model/def';
import { Policy } from '../src/model/policy';

describe('buildIndex', () => {
  const tests: { expr: string; expected: string[] }[] = [
    {
      expr: 'a && b',
      expected: ['->a', 'a->b'],
    },
    {
      expr: 'a || b',
      expected: ['->a', '->b'],
    },
    {
      expr: 'a && b && c',
      expected: ['->a', 'a->b', 'b->c'],
    },
    {
      expr: 'a || b || c',
      expected: ['->a', '->b', '->c'],
    },
    {
      expr: 'a && b || c',
      expected: ['->a', 'a->b', '->c'],
    },
    {
      expr: 'a || b && c',
      expected: ['->a', '->b', 'b->c'],
    },
    {
      expr: '(a || b) && (c || d)',
      expected: ['->a', '->b', 'a->c', 'a->d', 'b->c', 'b->d'],
    },
    {
      expr: '(a || b && c) && (d || f)',
      expected: ['->a', '->b', 'b->c', 'a->d', 'a->f', 'c->d', 'c->f'],
    },
    {
      expr: '(a || b) == (d || f)',
      expected: ['->(a || b) == (d || f)'],
    },
    {
      expr: 'fn(a) && b',
      expected: ['->fn(a)', 'fn(a)->b'],
    },
  ];

  let treeToList = (root: MatcherStage): string[] => {
    let res = [];
    let q = [root];
    let node = q.pop();
    while (node !== undefined) {
      q.push(...node.children);
      for (let child of node.children) {
        res.push(`${node.expr}->${child.expr}`);
      }
      node = q.pop();
    }
    return res;
  };

  for (let t of tests) {
    test(t.expr, () => {
      let index = buildIndex(t.expr);
      let list = treeToList(index).sort();
      expect(list).toEqual(t.expected.sort());
    });
  }
});

describe('rangeMatches', () => {
  const rules = [
    ['alice', 'data1', 'read'],
    ['alice', 'data1', 'write'],
    ['alice', 'data2', 'read'],
    ['bob', 'data2', 'read'],
    ['bob', 'data2', 'write'],
    ['bob', 'data1', 'read'],
  ];

  const tests: {
    name: string;
    matcher: string;
    req: string[];
    expected: string[][];
  }[] = [
    {
      name: 'alice, data1, read',
      matcher: 'p.sub == r.sub && p.obj == r.obj && p.act == r.act',
      req: ['alice', 'data1', 'read'],
      expected: [['alice', 'data1', 'read']],
    },
    {
      name: 'alice, read',
      matcher: 'p.sub == r.sub && p.act == r.act',
      req: ['alice', 'data1', 'read'],
      expected: [
        ['alice', 'data1', 'read'],
        ['alice', 'data2', 'read'],
      ],
    },
    {
      name: 'alice, data1',
      matcher: 'p.sub == r.sub && p.obj == r.obj',
      req: ['alice', 'data1', 'read'],
      expected: [
        ['alice', 'data1', 'read'],
        ['alice', 'data1', 'write'],
      ],
    },
    {
      name: 'bob',
      matcher: "p.sub == 'bob'",
      req: [],
      expected: [
        ['bob', 'data2', 'read'],
        ['bob', 'data2', 'write'],
        ['bob', 'data1', 'read'],
      ],
    },
  ];

  let rDef = new ParameterDef<any>('r', 'sub, obj, act');
  let pDef = new ParameterDef<string>('p', 'sub, obj, act');
  let p = new Policy();
  for (let rule of rules) {
    p.addRule(rule);
  }

  let joinAndSort = (rules: string[][]) => {
    return rules.map(rule => rule.join(', ')).sort();
  };

  for (let t of tests) {
    test(t.name, () => {
      let exprRoot = buildIndex(t.matcher);
      let m = new Matcher(rDef, pDef, p, exprRoot);

      let res: string[][] = [];
      m.eachMatch(t.req, rule => {
        res.push(rule);
        return true;
      });

      expect(joinAndSort(res)).toEqual(joinAndSort(t.expected));
    });
  }
});
