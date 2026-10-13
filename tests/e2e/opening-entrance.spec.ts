import { expect, test } from '@playwright/test';

test('统一入口能进入两种方式，切换后 Play 只读取当前身份', async ({ page }) => {
  const atlasRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('/data/')) atlasRequests.push(request.url()); });
  await page.goto('/#/opening');
  await expect(page.getByRole('link', { name: /进入自主选择/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /进入随机抽取/ })).toBeVisible();
  expect(atlasRequests).toEqual([]);

  await page.getByRole('link', { name: /进入自主选择/ }).click();
  await page.getByRole('button', { name: '查看蓝忘机角色档案' }).click();
  await page.getByRole('button', { name: '确定选择蓝忘机' }).click();
  await page.getByRole('link', { name: '返回开局方式' }).click();
  await expect(page.getByText('自主选择结果：蓝忘机')).toBeVisible();

  await page.getByRole('link', { name: /进入随机抽取/ }).click();
  await expect(page.getByText('未揭封的档案')).toBeVisible();
  await page.goto('/#/play');
  await expect(page.locator('.play-intro')).not.toContainText('蓝忘机');

  await page.goto('/#/draw');
  await page.getByRole('button', { name: '抽取我的角色' }).click();
  const name = await page.locator('.opening-card-content h2').textContent();
  await page.goto('/#/play');
  await expect(page.locator('.play-intro')).toContainText(`当前本地角色：${name}`);
});

test('手机开场入口不横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/opening');
  await expect(page.getByRole('link', { name: /进入自主选择/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /进入随机抽取/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
