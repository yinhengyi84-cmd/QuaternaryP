export type OpeningRole = {
  id: string;
  name: string;
  epithet: string;
  currentConnection: string;
  introduction: string;
  accent: string;
  mark: string;
};

export const OPENING_ROLES: readonly OpeningRole[] = [
  { id: 'lan-wangji', name: '蓝忘机', epithet: '霜雪下的命令', currentConnection: '苏联政权', introduction: '在红色政权的中枢，每一道命令都牵动前线与旧日情义。', accent: '#9dbdc5', mark: '蓝' },
  { id: 'wei-wuxian', name: '魏无羡', epithet: '废墟里的火种', currentConnection: '德国政局', introduction: '柏林的权力与战火交错，他仍试图为自己的选择留下余地。', accent: '#caa883', mark: '魏' },
  { id: 'wen-ruohan', name: '温若寒', epithet: '不熄的野心', currentConnection: '日本政局', introduction: '扩张与内斗同时逼近，掌权者必须判断谁还值得信任。', accent: '#bc8590', mark: '温' },
  { id: 'jin-guangyao', name: '金光瑶', epithet: '流亡者的棋局', currentConnection: '拜占庭与日本', introduction: '失去旧日王座之后，他在异国重织人脉，等待局势转向。', accent: '#d6ba7a', mark: '金' },
  { id: 'gao-zhan', name: '高战', epithet: '海风中的暗潮', currentConnection: '青岛局势', introduction: '海港、军队与街头的力量相互牵制，他的下一步尚无人能断言。', accent: '#89b4a8', mark: '高' },
  { id: 'cao-wenhao', name: '曹文浩', epithet: '坠入战场的旗帜', currentConnection: '拜占庭军队', introduction: '战场上的名望既是筹码，也是责任；他的立场仍可能被事件改变。', accent: '#a7a0c6', mark: '曹' },
];

const STORAGE_KEY = 'modaozushi.opening-draw.preview.v1';

export function readPreviewRole(): OpeningRole | null {
  try {
    const id = window.sessionStorage.getItem(STORAGE_KEY);
    return OPENING_ROLES.find(role => role.id === id) ?? null;
  } catch {
    return null;
  }
}

export function savePreviewRole(role: OpeningRole): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, role.id);
  } catch {
    // 浏览器禁用会话存储时，当前页面仍可完成预览。
  }
}

export function clearPreviewRole(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 无法访问存储时无需额外清理。
  }
}

export function drawPreviewRole(): OpeningRole {
  // 拒绝超出整除范围的随机数，避免取模造成的微小偏差。
  const range = 0x100000000;
  const limit = range - (range % OPENING_ROLES.length);
  const sample = new Uint32Array(1);
  do {
    window.crypto.getRandomValues(sample);
  } while (sample[0] >= limit);
  return OPENING_ROLES[sample[0] % OPENING_ROLES.length];
}
