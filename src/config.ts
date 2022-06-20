import { JudgeHandler, MatcherHandler, RetType } from './model/model_ext';
import { IJudgeFactory } from './model/judge/judge_api';
import { IMatcher } from './model/matcher/matcher_api';
import { IModel } from './model/model_api';

export interface BaseConfig {
  req?: any[];
  matcher?: string | IMatcher;
}

export interface EnforceConfig extends BaseConfig {
  judge?: string | IJudgeFactory;
}

export function getMatcher(
  model: IModel,
  matcher: string | IMatcher
): IMatcher {
  if (typeof matcher === 'string') {
    let mat = model.get<IMatcher>(RetType.Matcher, matcher);
    if (mat !== undefined) {
      return mat;
    }
    let handler = new MatcherHandler();
    return handler.create({ m: model, key: '', value: matcher });
  }
  return matcher;
}

export function getJudgeF(
  model: IModel,
  judge: string | IJudgeFactory
): IJudgeFactory {
  if (typeof judge === 'string') {
    let judgeF = model.get<IJudgeFactory>(RetType.Judge, judge);
    if (judgeF !== undefined) {
      return judgeF;
    }
    let handler = new JudgeHandler();
    return handler.create({ m: model, key: '', value: judge });
  }
  return judge;
}
