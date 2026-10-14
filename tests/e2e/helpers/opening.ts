import { expect, type Page } from '@playwright/test';

export async function choosePlayer(page: Page, name = '蓝忘机') {
  await page.goto('/#/choose');
  await page.getByRole('button', { name: `查看${name}角色档案` }).click();
  await page.getByRole('button', { name: `确定选择${name}` }).click();
  await page.getByRole('link', { name: '进入我的 Play 页面' }).click();
  await expect(page.getByRole('heading', { name: '我的行动与判定' })).toBeVisible();
}
