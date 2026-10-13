import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/play');
  await expect(page.locator('.province')).toHaveCount(190);
});

test('玩家只看到自己的行动、判定和等待状态', async ({ page }) => {
  await expect(page.getByRole('heading', { name: '我的行动与判定' })).toBeVisible();
  await expect(page.locator('.play-turn-order')).toHaveCount(0);
  await expect(page.locator('.play-seat')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '角色六维' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '投掷 D20' })).toBeDisabled();
  await page.getByLabel('你打算做什么？').fill('派出使者争取停火，并守住边境渡口。');
  await page.getByRole('button', { name: '提交我的行动' }).click();
  await expect(page.getByText('等待 DM 审核')).toBeVisible();
  await expect(page.getByRole('button', { name: '投掷 D20' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '模拟 DM 锁定条件' })).toHaveCount(0);
  await expect(page.getByText('判定条件已送达').first()).toBeVisible({ timeout: 6000 });
  await expect(page.getByText('难度 DC')).toBeVisible();
  await page.getByRole('button', { name: '投掷 D20' }).click();
  const dialog = page.getByRole('dialog', { name: '命运正在转动' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('.d20-die-art')).toHaveCSS('animation-name', 'd20-spin');
  await expect(page.locator('#root')).toHaveAttribute('inert', '');
  await expect(dialog.getByRole('button', { name: '查看我的剧情' })).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: '判定已揭晓' })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: '查看我的剧情' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText(/以上为固定模板示例，尚未接入剧情智能体/)).toBeVisible();
  await expect(page.getByText('本次判定已完成，等待 DM 的下一步安排。你无需查看其他玩家的行动。')).toBeVisible();
  await expect(page.getByRole('button', { name: /切换至下一席/ })).toHaveCount(0);
  await expect(page.getByLabel('你打算做什么？')).toHaveValue('派出使者争取停火，并守住边境渡口。');
});

test('地点可搜索和查阅，手机地图可折叠且页面不横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('textbox', { name: '搜索行动地点' }).fill('长沙');
  await page.getByRole('button', { name: /长沙／潭州/ }).first().click();
  await expect(page.locator('.play-place-summary')).toContainText('长沙／潭州');
  await page.getByText('查看所属地区资料').click();
  await expect(page.locator('.play-place-details')).toContainText('所属地区资料');
  await page.getByRole('button', { name: '收起地图' }).click();
  await expect(page.locator('#play-map-body')).toHaveCount(0);
  await page.getByRole('button', { name: '展开地图' }).click();
  await expect(page.locator('.province')).toHaveCount(190);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('手机减少动态效果时仍能看到投掷结果', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByLabel('你打算做什么？').fill('检查前线补给。');
  await page.getByRole('button', { name: '提交我的行动' }).click();
  await expect(page.getByText('判定条件已送达').first()).toBeVisible({ timeout: 6000 });
  await page.getByRole('button', { name: '投掷 D20' }).click();
  await expect(page.locator('.d20-die-art')).toHaveCSS('animation-name', 'none');
  await expect(page.getByRole('dialog', { name: '判定已揭晓' })).toBeVisible({ timeout: 800 });
  const box = await page.locator('.d20-panel').boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: '查看我的剧情' }).click();
  await expect(page.locator('.play-waiting')).toBeVisible();
});

test('旧来源页入口消失，许可说明仍可访问', async ({ page }) => {
  await page.getByRole('link', { name: '返回地理志' }).click();
  await expect(page.getByRole('button', { name: '版图与资料' })).toHaveCount(0);
  await page.getByLabel('地图数据来源与许可').click();
  await expect(page.getByText('真实行政边界采用 geoBoundaries gbOpen 的固定版本')).toBeVisible();
});
