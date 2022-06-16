import { Enforcer } from '../src';
import fs from 'fs';
import { UcastSetup } from '../examples/abac_ucast';

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
