import { expect, test } from '@playwright/test';
import { choosePlayer } from './helpers/opening';

test('默认和未知入口都进入开局，未选角色不能进入玩家页', async ({ page }) => {
  const atlasRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('/data/')) atlasRequests.push(request.url()); });
  for (const url of ['/', '/#', '/#/unknown', '/#/play']) {
    await page.goto(url);
    await expect(page.getByRole('heading', { name: /命运，由你选择/ })).toBeVisible();
    await expect(page).toHaveURL(/#\/opening$/);
  }
  expect(atlasRequests).toEqual([]);
  await page.goto('/#/atlas');
  await page.getByRole('link', { name: '玩家主页面' }).click();
  await expect(page.getByRole('heading', { name: /命运，由你选择/ })).toBeVisible();
});

test('有身份打开根地址显示继续游玩，两种入口品牌都返回开局', async ({ page }) => {
  await choosePlayer(page);
  await page.goto('/');
  await page.getByRole('link', { name: '继续以蓝忘机游玩' }).click();
  await expect(page.locator('.play-intro')).toContainText('蓝忘机');
  await page.goto('/#/choose');
  await page.locator('.choice-brand').click();
  await expect(page).toHaveURL(/#\/opening$/);
  await page.goto('/#/draw');
  await page.locator('.opening-brand').click();
  await expect(page).toHaveURL(/#\/opening$/);
});

test('手机大按钮在地图折叠时可用，往返保留草稿和地点并支持前进后退', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await choosePlayer(page);
  await page.getByLabel('你打算做什么？').fill('守住长沙的铁路。');
  await page.getByLabel('搜索行动地点').fill('长沙');
  await page.getByRole('button', { name: /长沙／潭州/ }).first().click();
  await page.getByRole('button', { name: '收起地图' }).click();
  await expect(page.getByRole('button', { name: '完整档案' })).toHaveCount(0);
  await page.getByRole('button', { name: '地图志', exact: true }).click();
  await expect(page.getByTestId('region-title')).toHaveText('长沙／潭州');
  await expect(page.locator('.dossier')).toHaveClass(/mobile-open/);
  await expect(page.getByRole('link', { name: '玩家主页面' })).toBeVisible();
  await page.getByRole('link', { name: '玩家主页面' }).click();
  await expect(page.getByLabel('你打算做什么？')).toHaveValue('守住长沙的铁路。');
  await expect(page.getByRole('button', { name: '展开地图' })).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('region-title')).toHaveText('长沙／潭州');
  await page.goForward();
  await expect(page.getByLabel('你打算做什么？')).toHaveValue('守住长沙的铁路。');
  await page.getByRole('button', { name: '展开地图' }).click();
  await expect(page.locator('.play-place-summary')).toContainText('长沙／潭州');

  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const button = page.getByRole('button', { name: '地图志', exact: true });
    await expect(button).toBeVisible();
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/navigation-play-${width}.png` });
  }
});

test('等待审核时往返不撤回，留在地图志期间计时正常推进', async ({ page }) => {
  await choosePlayer(page);
  await page.getByLabel('你打算做什么？').fill('争取停火。');
  await page.getByRole('button', { name: '提交我的行动' }).click();
  await page.getByRole('button', { name: '地图志', exact: true }).click();
  await page.getByRole('link', { name: '玩家主页面' }).click();
  await expect(page.locator('.play-stage')).toHaveText('等待 DM 审核');
  await page.getByRole('button', { name: '地图志', exact: true }).click();
  await page.waitForTimeout(3100);
  await page.getByRole('link', { name: '玩家主页面' }).click();
  await expect(page.locator('.play-stage')).toHaveText('判定条件已送达');
  await expect(page.getByLabel('你打算做什么？')).toHaveValue('争取停火。');
});

test('投掷时通过历史离开会释放弹窗，返回不重复投掷或重播动画', async ({ page }) => {
  await choosePlayer(page);
  await page.getByRole('button', { name: '地图志', exact: true }).click();
  await page.getByRole('link', { name: '玩家主页面' }).click();
  await page.getByLabel('你打算做什么？').fill('检查守军部署。');
  await page.getByRole('button', { name: '提交我的行动' }).click();
  await expect(page.getByRole('button', { name: '投掷 D20' })).toBeEnabled({ timeout: 6000 });
  await page.getByRole('button', { name: '投掷 D20' }).click();
  const die = await page.locator('.play-die strong').textContent();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#\/atlas$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#root')).not.toHaveAttribute('inert', '');
  await page.getByRole('link', { name: '玩家主页面' }).click();
  await expect(page.locator('.play-stage')).toHaveText('等待后续安排', { timeout: 5000 });
  await expect(page.locator('.play-die strong')).toHaveText(die ?? '');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const result = await page.locator('.play-outcome strong').textContent();
  await page.getByRole('button', { name: '地图志', exact: true }).click();
  await page.getByRole('link', { name: '玩家主页面' }).click();
  await expect(page.locator('.play-outcome strong')).toHaveText(result ?? '');
});

test('重新选择同一角色清空旧行动，继续游玩入口保留原进度', async ({ page }) => {
  await choosePlayer(page);
  await page.getByLabel('你打算做什么？').fill('上一局行动。');
  await page.evaluate(() => { window.location.hash = '#/opening'; });
  await page.getByRole('link', { name: '继续以蓝忘机游玩' }).click();
  await expect(page.getByLabel('你打算做什么？')).toHaveValue('上一局行动。');
  await page.evaluate(() => { window.location.hash = '#/choose'; });
  await page.getByRole('button', { name: '重新选择（仅本地预览）' }).click();
  await page.getByRole('button', { name: '查看蓝忘机角色档案' }).click();
  await page.getByRole('button', { name: '确定选择蓝忘机' }).click();
  await page.getByRole('link', { name: '进入我的 Play 页面' }).click();
  await expect(page.getByLabel('你打算做什么？')).toHaveValue('');
  await expect(page.locator('.play-stage')).toHaveText('撰写中');
  await expect(page.locator('.play-die strong')).toHaveText('D20');
});

test('抽取路径可往返地图志，键盘能操作两个主入口', async ({ page }) => {
  await page.goto('/#/draw');
  await page.getByRole('button', { name: '抽取我的角色' }).click();
  const name = await page.locator('.opening-card-content h2').textContent();
  await page.locator('a.opening-primary').click();
  const atlas = page.getByRole('button', { name: '地图志', exact: true });
  await atlas.focus();
  await page.keyboard.press('Enter');
  const player = page.getByRole('link', { name: '玩家主页面' });
  await player.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.play-intro')).toContainText(`当前本地角色：${name}`);
});
