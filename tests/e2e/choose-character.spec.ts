import { expect, test } from '@playwright/test';

test('六人档案、塔罗对应和自主选择进入个人 Play', async ({ page }) => {
  const atlasRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('/data/')) atlasRequests.push(request.url()); });
  await page.goto('/#/choose');
  await expect(page.getByRole('heading', { name: '选择你的命运。' })).toBeVisible();
  expect(atlasRequests).toEqual([]);
  await expect(page.locator('.choice-card')).toHaveCount(6);
  await expect(page.getByRole('button', { name: '查看曹文浩角色档案' })).toBeVisible();
  await expect(page.getByText('曹文豪')).toHaveCount(0);

  await page.getByRole('button', { name: '查看蓝忘机角色档案' }).click();
  const dialog = page.getByRole('dialog', { name: '蓝忘机' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('皇帝');
  await expect(dialog).toContainText('逆位');
  await expect(dialog).toContainText('苏维埃最高极权统帅。依靠致幻剂篡改记忆的伪神，陷入病态的独裁之中。');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  await page.getByRole('button', { name: '查看曹文浩角色档案' }).click();
  await page.getByRole('button', { name: '确定选择曹文浩' }).click();
  await expect(page.getByRole('heading', { name: '曹文浩' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '曹文浩' })).toBeVisible();
  await page.getByRole('link', { name: '进入我的 Play 页面' }).click();
  await expect(page.locator('.play-intro')).toContainText('当前试选角色：曹文浩');
});

test('手机可选角且不横向溢出，减少动态效果仍可揭晓', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/choose');
  await expect(page.locator('.choice-card')).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: '查看魏无羡角色档案' }).click();
  await expect(page.getByRole('dialog', { name: '魏无羡' })).toBeVisible();
  await page.getByRole('button', { name: '确定选择魏无羡' }).click();
  await expect(page.getByRole('heading', { name: '魏无羡' })).toBeVisible({ timeout: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: '重新选择（仅本地预览）' }).click();
  await expect(page.locator('.choice-card')).toHaveCount(6);
});
