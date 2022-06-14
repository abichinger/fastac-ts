import { Enforcer } from '../src';
import { Model } from '../src/model/model';
import { Policy } from '../src/model/policy';
import { FileAdapter } from '../src/storage/file_adapter';
import ini from 'ini';
import fs from 'fs';

describe('test eachRule', () => {
  const tests: { model: string; policy: string }[] = [
    {
      model: 'examples/acl_model.conf',
      policy: 'examples/acl_policy.csv',
    },
    {
      model: 'examples/rbac_model.conf',
      policy: 'examples/rbac_policy.csv',
    },
    {
      model: 'examples/rbac_matcher_model.conf',
      policy: 'examples/rbac_matcher_policy.csv',
    },
  ];

  test.each(tests)('%s', ({ model, policy }) => {
    let e = new Enforcer(model, policy);
    let m = e.getModel();

    let ruleSet = new Policy();
    let adapter = new FileAdapter(policy);
    adapter.loadPolicy(ruleSet);
    let expected = Array.from(ruleSet).map(rule => rule.join(','));

    let actual: string[] = [];
    m.eachRule(rule => {
      actual.push(rule.join(','));
      return true;
    });
    expect(actual.sort()).toEqual(expected.sort());
  });
});

describe('test toString', () => {
  const tests: string[] = [
    'examples/acl_model.conf',
    'examples/rbac_model.conf',
    'examples/rbac_matcher_model.conf',
  ];

  test.each(tests)('%s', model => {
    let expected = ini.parse(fs.readFileSync(model, 'utf-8'));

    let m = Model.fromFile(model);
    let actual = ini.parse(m.toString());

    expect(actual).toEqual(expected);
  });
});
