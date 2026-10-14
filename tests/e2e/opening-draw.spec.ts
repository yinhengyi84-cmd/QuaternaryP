import { expect, test } from '@playwright/test';

test('单人抽取、刷新保留并进入个人 Play 页面', async ({ page }) => {
  await page.goto('/#/draw');
  await expect(page.getByRole('heading', { name: /命运落在/ })).toBeVisible();
  await expect(page.getByText('未揭封的档案')).toBeVisible();
  await expect(page.getByRole('button', { name: '抽取我的角色' })).toBeVisible();
  await expect(page.locator('.play-seat, .play-turn-order')).toHaveCount(0);

  await page.getByRole('button', { name: '抽取我的角色' }).click();
  const role = page.locator('.opening-card-content h2');
  await expect(role).toBeVisible();
  const name = await role.textContent();
  expect(['蓝忘机', '魏无羡', '温若寒', '金光瑶', '高战', '曹文浩']).toContain(name);
  await expect(page.locator('.opening-tarot-art svg')).toBeVisible();
  await expect(page.locator('.opening-card-content .initial-faction-badge')).toBeVisible();

  await page.reload();
  await expect(page.locator('.opening-card-content h2')).toHaveText(name!);
  await page.getByRole('link', { name: `以${name}进入 Play` }).click();
  await expect(page.getByRole('heading', { name: '我的行动与判定' })).toBeVisible();
  await expect(page.locator('.play-intro')).toContainText(`当前本地角色：${name}`);
  await page.getByRole('button', { name: '我的角色' }).click();
  await expect(page.getByRole('dialog', { name: name ?? '' })).toBeVisible();
});

test('试抽可重置，手机宽度与减少动态效果可用', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/draw');
  await page.getByRole('button', { name: '抽取我的角色' }).click();
  await expect(page.locator('.opening-card-content h2')).toBeVisible({ timeout: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: '重新试抽' }).click();
  await expect(page.getByText('未揭封的档案')).toBeVisible();
  await page.reload();
  await expect(page.getByText('未揭封的档案')).toBeVisible();
});
