import { Enforcer } from '../src';
import fs from 'fs';
import { UcastSetup } from '../examples/abac_ucast';
import { EvaluableExpression } from '../src/model/static/param_types';
import { IMatcher } from '../src/model/matcher/matcher_api';

export interface TestLifecycle {
  before(): void;
  after(): void;
}

interface Request {
  req: any[];
  expected: boolean;
}

function parseRequests(path: string): Request[] {
  let content = fs.readFileSync(path, 'utf-8');
  return JSON.parse(content) as Request[];
}

const tmp_dir = '.tmp';

beforeEach(() => {
  if (!fs.existsSync(tmp_dir)) {
    fs.mkdirSync(tmp_dir);
  }
});

afterEach(() => {
  fs.rmSync(tmp_dir, { recursive: true, force: true });
});

describe('test models', () => {
  let enforcers = new Map<string, Enforcer>();
  let getEnforcer = async (model: string, policy: string) => {
    let key = `${model}:${policy}`;
    let e = enforcers.get(key);
    if (e === undefined) {
      e = new Enforcer(model, policy);
      await e.loadPolicy();
      enforcers.set(key, e);
    }
    return e;
  };

  const tests: {
    model: string;
    policy: string;
    requests: string;
    lc: TestLifecycle | undefined;
  }[] = [
    {
      model: 'examples/acl_model.conf',
      policy: 'examples/acl_policy.csv',
      requests: 'examples/acl_test.json',
      lc: undefined,
    },
    {
      model: 'examples/acl_model.conf',
      policy: 'examples/acl_policy.json',
      requests: 'examples/acl_test.json',
      lc: undefined,
    },
    {
      model: 'examples/rbac_model.conf',
      policy: 'examples/rbac_policy.csv',
      requests: 'examples/rbac_test.json',
      lc: undefined,
    },
    {
      model: 'examples/rbac_matcher_model.conf',
      policy: 'examples/rbac_matcher_policy.csv',
      requests: 'examples/rbac_matcher_test.json',
      lc: undefined,
    },
    {
      model: 'examples/abac_model.conf',
      policy: 'examples/abac_policy.json',
      requests: 'examples/abac_test.json',
      lc: undefined,
    },
    {
      model: 'examples/abac_eval_model.conf',
      policy: 'examples/abac_eval_policy.json',
      requests: 'examples/abac_eval_test.json',
      lc: undefined,
    },
    {
      model: 'examples/abac_ucast_model.conf',
      policy: 'examples/abac_ucast_policy.json',
      requests: 'examples/abac_eval_test.json',
      lc: new UcastSetup(),
    },
    {
      model: 'examples/rbac_abac_model.conf',
      policy: 'examples/rbac_abac_policy.json',
      requests: 'examples/rbac_abac_test.json',
      lc: undefined,
    },
  ];

  describe.each(tests)('%s', ({ model, policy, requests, lc }) => {
    let reqs = parseRequests(requests);
    lc?.before();

    test.each(reqs)('%s', async ({ req, expected }) => {
      let enforcer = await getEnforcer(model, policy);
      expect(enforcer.enforce({ req: req })).toEqual(expected);
    });
  });
});

describe('test filter', () => {
  const tests: {
    model: string;
    policy: string;
    req?: any[];
    matcher?: IMatcher | string;
    expected: any[][];
  }[] = [
    {
      model: 'examples/acl_model.conf',
      policy: 'examples/acl_policy.csv',
      matcher: "p.sub == 'alice'",
      expected: [
        ['p', 'alice', 'data1', 'read'],
        ['p', 'alice', 'data1', 'write'],
        ['p', 'alice', 'data2', 'read'],
      ],
    },
    {
      model: 'examples/rbac_model.conf',
      policy: 'examples/rbac_policy.csv',
      matcher: 'g.role == "user"',
      expected: [
        ['g', 'alice', 'user'],
        ['g', 'bob', 'user'],
      ],
    },
    {
      model: 'examples/abac_eval_model.conf',
      policy: 'examples/abac_eval_policy.json',
      matcher: 'p.rule.eval({sub:r.sub})',
      req: [{ age: 20 }],
      expected: [
        ['p', 'sub.age > 18', 'data1', 'read'],
        ['p', 'sub.age > 12', 'data2', 'read'],
      ],
    },
  ];

  test.each(tests)('%s', async t => {
    let e = new Enforcer(t.model, t.policy);
    await e.loadPolicy();
    let config = {
      ...(t.matcher && { matcher: t.matcher }),
      ...(t.req && { req: t.req }),
    };
    let actual = e.filter(config);
    actual = actual.map(rule => {
      return rule.map(v => v + '');
    });
    expect(actual).toEqual(t.expected);
  });
});

describe('test storage', () => {
  const tests: {
    model: string;
    adapter: string;
    storage: boolean;
    autosave: boolean;
    addRules: any[][];
    removeRules: any[][];
    expected: string[][];
  }[] = [
    {
      model: 'examples/acl_model.conf',
      adapter: 'storage_test_01.json',
      storage: false,
      autosave: false,
      addRules: [
        ['p', 'alice', 'data1', 'read'],
        ['p', 'alice', 'data2', 'read'],
        ['p', 'alice', 'data3', 'read'],
      ],
      removeRules: [['p', 'alice', 'data3', 'read']],
      expected: [[]],
    },
    {
      model: 'examples/acl_model.conf',
      adapter: 'storage_test_02.json',
      storage: true,
      autosave: false,
      addRules: [
        ['p', 'alice', 'data1', 'read'],
        ['p', 'alice', 'data2', 'read'],
        ['p', 'alice', 'data3', 'read'],
      ],
      removeRules: [['p', 'alice', 'data3', 'read']],
      expected: [
        ['p', 'alice', 'data1', 'read'],
        ['p', 'alice', 'data2', 'read'],
      ],
    },
    {
      model: 'examples/acl_model.conf',
      adapter: 'storage_test_03.json',
      storage: true,
      autosave: true,
      addRules: [
        ['p', 'alice', 'data1', 'read'],
        ['p', 'alice', 'data2', 'read'],
        ['p', 'alice', 'data3', 'read'],
      ],
      removeRules: [
        ['p', 'alice', 'data2', 'read'],
        ['p', 'alice', 'data3', 'read'],
      ],
      expected: [['p', 'alice', 'data1', 'read']],
    },
    {
      model: 'examples/abac_eval_model.conf',
      adapter: 'storage_test_04.json',
      storage: true,
      autosave: false,
      addRules: [
        ['p', EvaluableExpression.fromString('sub.age > 18'), 'data1', 'read'],
        ['p', EvaluableExpression.fromString('sub.age > 12'), 'data2', 'read'],
        ['p', EvaluableExpression.fromString('sub.age < 18'), 'data3', 'read'],
      ],
      removeRules: [
        ['p', EvaluableExpression.fromString('sub.age > 12'), 'data2', 'read'],
      ],
      expected: [
        ['p', 'sub.age > 18', 'data1', 'read'],
        ['p', 'sub.age < 18', 'data3', 'read'],
      ],
    },
  ];

  const getActual = (path: string): any[][] => {
    if (!fs.existsSync(path)) {
      return [[]];
    }
    let content = fs.readFileSync(path, 'utf-8');
    return JSON.parse(content);
  };

  const sleep = (ms: number) => {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  };

  test.each(tests)('simple %s', async t => {
    let enforcer = new Enforcer(t.model, tmp_dir + '/' + t.adapter, {
      storage: t.storage,
      autosave: t.autosave,
    });
    for (let rule of t.addRules) {
      enforcer.addRule(rule);
    }
    for (let rule of t.removeRules) {
      enforcer.removeRule(rule);
    }
    if (t.autosave === false) {
      await enforcer.flush();
    } else {
      //wait for flush
      await sleep(50);
    }

    let actual = getActual(tmp_dir + '/' + t.adapter);
    expect(actual).toEqual(t.expected);
  });

  test.each(tests)('batch %s', async t => {
    let enforcer = new Enforcer(t.model, tmp_dir + '/b_' + t.adapter, {
      storage: t.storage,
      autosave: t.autosave,
    });
    enforcer.addRules(t.addRules);
    enforcer.removeRules(t.removeRules);
    if (t.autosave === false) {
      await enforcer.flush();
    } else {
      //wait for flush
      await sleep(100);
    }

    let actual = getActual(tmp_dir + '/b_' + t.adapter);
    expect(actual).toEqual(t.expected);
  });
});
