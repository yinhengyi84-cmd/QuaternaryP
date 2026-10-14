import { describe, expect, it } from 'vitest';
import { resolveAppRoute } from '../src/navigation';
import { createPlaySession, playSessionReducer } from '../src/play-session';

describe('开局路由', () => {
  it('空地址和未知地址进入开局，玩家页要求已分配角色', () => {
    for (const hash of ['', '#', '#/unknown']) expect(resolveAppRoute(hash, 'lan-wangji')).toBe('opening');
    expect(resolveAppRoute('#/play', null)).toBe('opening');
    expect(resolveAppRoute('#/play', 'lan-wangji')).toBe('play');
    expect(resolveAppRoute('#/atlas', null)).toBe('atlas');
  });
});

describe('当前网页内的游玩状态', () => {
  it('模拟审核按原截止时间完成，撤回会取消截止时间', () => {
    let state = createPlaySession('lan-wangji', '1:lan-wangji');
    state = playSessionReducer(state, { type: 'edit', action: '守住渡口' });
    state = playSessionReducer(state, { type: 'submit', now: 100 });
    expect(state.lockAt).toBe(3100);
    expect(playSessionReducer(state, { type: 'advance', now: 3000 }).stage).toBe('submitted');
    expect(playSessionReducer(state, { type: 'advance', now: 4000 }).stage).toBe('locked');
    const revoked = playSessionReducer(state, { type: 'revoke' });
    expect(revoked.lockAt).toBeNull();
    expect(playSessionReducer(revoked, { type: 'advance', now: 4000 }).stage).toBe('draft');
  });

  it('已生成的骰点不能被重复投掷或页面切换后的延时覆盖', () => {
    let state = createPlaySession('lan-wangji', '1:lan-wangji');
    state = { ...state, stage: 'locked', action: '检查补给' };
    state = playSessionReducer(state, { type: 'roll', die: 17, now: 100, duration: 1850 });
    expect(playSessionReducer(state, { type: 'roll', die: 2, now: 200, duration: 1850 }).die).toBe(17);
    state = playSessionReducer(state, { type: 'advance', now: 1950 });
    expect(state.stage).toBe('resolved');
    expect(state.die).toBe(17);
  });

  it('相同身份正常返回不重置，重新选同一角色也开始新一局', () => {
    const state = { ...createPlaySession('lan-wangji', '1:lan-wangji'), action: '旧行动', die: 17 };
    expect(playSessionReducer(state, { type: 'reset', characterId: 'lan-wangji', identityKey: '1:lan-wangji' })).toBe(state);
    const next = playSessionReducer(state, { type: 'reset', characterId: 'lan-wangji', identityKey: '2:lan-wangji' });
    expect(next.action).toBe('');
    expect(next.die).toBeNull();
    expect(next.stage).toBe('draft');
  });
});
