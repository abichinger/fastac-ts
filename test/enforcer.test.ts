import { Enforcer } from '../src';
import fs from 'fs';

interface Request {
  line: string;
  rvals: string[];
  expected: boolean;
}

function parseRequests(path: string): Request[] {
  let content = fs.readFileSync(path, 'utf-8');
  let lines = content.split('\n');
  let res: Request[] = [];
  for (let line of lines) {
    line = line.trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    let i = line.indexOf('->');
    if (i === -1) {
      throw new Error(`invalid request: ${line}`);
    }
    let rvals = line
      .substring(0, i)
      .split(',')
      .map(v => v.trim());
    let expected = line.substring(i + 2).trim() === 'true';
    res.push({ line, rvals, expected });
  }
  return res;
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

  const tests: { model: string; policy: string; requests: string }[] = [
    {
      model: 'examples/acl_model.conf',
      policy: 'examples/acl_policy.csv',
      requests: 'examples/acl_test.txt',
    },
    {
      model: 'examples/acl_model.conf',
      policy: 'examples/acl_policy.json',
      requests: 'examples/acl_test.txt',
    },
    {
      model: 'examples/rbac_model.conf',
      policy: 'examples/rbac_policy.csv',
      requests: 'examples/rbac_test.txt',
    },
    {
      model: 'examples/rbac_matcher_model.conf',
      policy: 'examples/rbac_matcher_policy.csv',
      requests: 'examples/rbac_matcher_test.txt',
    },
  ];

  describe.each(tests)('%s', ({ model, policy, requests }) => {
    let reqs = parseRequests(requests);

    test.each(reqs)('%s', async ({ rvals, expected }) => {
      let enforcer = await getEnforcer(model, policy);
      expect(enforcer.enforce({ req: rvals })).toEqual(expected);
    });
  });
});
