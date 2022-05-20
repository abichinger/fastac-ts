import { ParameterDef } from '../def';
import { Effect, IJudge, IJudgeFactory, Judgement } from './judge_api';

function getEft(rule: string[], pDef: ParameterDef<string>): Effect {
  if (pDef.has('eft')) {
    let eft = pDef.get(rule, 'eft');
    if (eft === 'allow' || eft === '') {
      return Effect.Allow;
    } else if (eft === 'deny') {
      return Effect.Deny;
    } else {
      return Effect.Indeterminate;
    }
  }
  return Effect.Allow;
}

class SomeAllow implements IJudge {
  constructor() {}

  eval(rule: string[], pDef: ParameterDef<string>): Judgement {
    let effect = getEft(rule, pDef);
    if (effect === Effect.Allow) {
      return {
        effect: effect,
        matched: rule,
      };
    }
    return {
      effect: Effect.Indeterminate,
    };
  }
  finalize(): Judgement {
    return {
      effect: Effect.Deny,
    };
  }
}

class NoDeny implements IJudge {
  constructor() {}

  eval(rule: string[], pDef: ParameterDef<string>): Judgement {
    let effect = getEft(rule, pDef);
    if (effect === Effect.Deny) {
      return {
        effect: effect,
        matched: rule,
      };
    }
    return {
      effect: Effect.Indeterminate,
    };
  }
  finalize(): Judgement {
    return {
      effect: Effect.Allow,
    };
  }
}

export class JudgeFactory implements IJudgeFactory {
  judge_key: string;

  constructor(judge_key: string) {
    this.judge_key = judge_key;
    this.getJudge();
  }
  getJudge(): IJudge {
    if (this.judge_key == 'some_allow') {
      return new SomeAllow();
    } else if (this.judge_key === 'no_deny') {
      return new NoDeny();
    } else {
      throw new Error(`unknown judge definition: ${this.judge_key}`);
    }
  }
}
