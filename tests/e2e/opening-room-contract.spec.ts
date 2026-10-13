import { expect, test } from '@playwright/test';

test('房间选择：等待座次、占用角色不可选、提交后等 DM 批准', async ({ page }) => {
  await page.goto('/tests/fixtures/opening-room.html?mode=choose');
  await expect(page.getByText('等待你的选角回合')).toBeVisible();
  await expect(page.locator('.choice-card')).toHaveCount(0);

  await page.evaluate(() => window.dispatchEvent(new Event('fixture:advance')));
  await expect(page.locator('.choice-card')).toHaveCount(6);
  await expect(page.getByRole('button', { name: '查看蓝忘机角色档案' })).toBeDisabled();
  await page.getByRole('button', { name: '查看曹文浩角色档案' }).click();
  await page.getByRole('button', { name: '确定选择曹文浩' }).click();
  await expect(page.getByText('选择已送达 DM')).toBeVisible();
  await expect(page.locator('.choice-result')).toHaveCount(0);

  await page.evaluate(() => window.dispatchEvent(new Event('fixture:approve')));
  await expect(page.locator('.choice-result h2')).toHaveText('曹文浩');
  await expect(page.locator('.choice-result')).toContainText('初始阵营 · 拜占庭');
  await expect(page.getByRole('button', { name: /重新选择/ })).toHaveCount(0);
});

test('房间抽取：等待座次后由网关直接锁定并向本人揭晓', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tests/fixtures/opening-room.html?mode=draw');
  await expect(page.getByText('等待轮到你的抽取回合…')).toBeVisible();
  await expect(page.getByRole('button', { name: '抽取我的角色' })).toHaveCount(0);

  await page.evaluate(() => window.dispatchEvent(new Event('fixture:advance')));
  await page.getByRole('button', { name: '抽取我的角色' }).click();
  await expect(page.locator('.opening-card-content h2')).toHaveText('魏无羡');
  await expect(page.locator('.opening-card-content')).toContainText('愚者 · 正位');
  await expect(page.locator('.opening-card-content')).toContainText('初始阵营 · 德意志');
  await expect(page.getByRole('button', { name: '重新试抽' })).toHaveCount(0);
});

test('并发占用后刷新可用角色，抽取事件不会跳过揭晓动画', async ({ page }) => {
  await page.goto('/tests/fixtures/opening-room.html?mode=choose');
  await page.evaluate(() => window.dispatchEvent(new Event('fixture:advance')));
  await page.getByRole('button', { name: '查看高战角色档案' }).click();
  await page.getByRole('button', { name: '确定选择高战' }).click();
  await expect(page.getByText('高战刚被其他玩家占用。')).toBeVisible();
  await expect(page.getByRole('button', { name: '查看高战角色档案' })).toBeDisabled();

  await page.goto('/tests/fixtures/opening-room.html?mode=draw');
  await page.evaluate(() => window.dispatchEvent(new Event('fixture:advance')));
  await page.getByRole('button', { name: '抽取我的角色' }).click();
  await expect(page.getByText('正在揭开命运…')).toBeVisible();
  await expect(page.locator('.opening-card-content h2')).toHaveCount(0);
  await expect(page.locator('.opening-card-content h2')).toHaveText('魏无羡');
});
