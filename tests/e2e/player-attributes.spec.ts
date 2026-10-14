import { expect, test, type Page } from '@playwright/test';
import { CHARACTERS } from '../../src/opening-characters';
import { INITIAL_FACTION_ATTRIBUTES, INITIAL_ROLE_ATTRIBUTES, initialAttributesFor } from '../../src/player-attributes';

const panel = (page: Page) => page.getByRole('region', { name: '我的八维', exact: true });
const score = (page: Page, key: string) => panel(page).locator(`dl [data-attribute="${key}"] dd`);
async function send(page: Page, name: string, detail?: unknown) {
  await page.evaluate(({ name, detail }) => window.dispatchEvent(new CustomEvent(name, { detail })), { name, detail });
}

test('未选角色有提示，自主选择曹文浩显示零分并适配手机与电脑', async ({ page }) => {
  await page.goto('/#/play');
  await expect(page.getByRole('heading', { name: /命运，由你选择/ })).toBeVisible();
  await page.goto('/#/choose');
  await page.getByRole('button', { name: '查看曹文浩角色档案' }).click();
  await page.getByRole('button', { name: '确定选择曹文浩' }).click();
  await page.getByRole('link', { name: '进入我的 Play 页面' }).click();
  await expect(panel(page)).toContainText('曹文浩');
  await expect(score(page, 'power')).toHaveText('0');
  await expect(score(page, 'wisdom')).toHaveText('19');
  await expect(score(page, 'economy')).toHaveText('7');
  const dot = panel(page).locator('circle[data-attribute="power"]');
  await expect(dot).toHaveAttribute('cx', '180');
  await expect(dot).toHaveAttribute('cy', '160');

  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await panel(page).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const radar = await panel(page).locator('.attributes-figure').boundingBox();
    const numbers = await panel(page).locator('.attributes-groups').boundingBox();
    if (width < 760) expect(numbers!.y).toBeGreaterThanOrEqual(radar!.y + radar!.height);
    else expect(numbers!.x).toBeGreaterThanOrEqual(radar!.x + radar!.width);
    await page.screenshot({ path: `test-results/attributes-${width}.png` });
  }
});

test('随机抽取进入 Play 后使用同一身份的初值', async ({ page }) => {
  await page.goto('/#/draw');
  await page.getByRole('button', { name: '抽取我的角色' }).click();
  const title = page.locator('.opening-card-content h2');
  await expect(title).toBeVisible();
  const name = await title.textContent();
  const character = CHARACTERS.find(item => item.name === name);
  if (!character) throw new Error('抽取角色不存在');
  await page.goto('/#/play');
  await expect(panel(page)).toContainText(character.name);
  await expect(score(page, 'power')).toHaveText(String(INITIAL_ROLE_ATTRIBUTES[character.id].power));
  await expect(score(page, 'economy')).toHaveText(String(INITIAL_FACTION_ATTRIBUTES[character.initialFactionId].economy));
});

test('完整快照更新阵营和四维，忽略旧消息，异常保留有效值且不重投 D20', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tests/fixtures/player-attributes.html');
  await expect(score(page, 'power')).toHaveText('15');
  await page.getByLabel('你打算做什么？').fill('检查前线补给。');
  const initial = initialAttributesFor('lan-wangji');
  const changed = {
    ...initial, currentFactionId: 'D', role: { ...initial.role, power: 20 },
    faction: { ...INITIAL_FACTION_ATTRIBUTES.D }, version: 2,
  };
  await send(page, 'fixture:attributes', changed);
  await expect(score(page, 'power')).toHaveText('20');
  await expect(score(page, 'military')).toHaveText('10');
  await expect(panel(page).getByRole('region', { name: '当前阵营四维' })).toContainText('德意志');
  await expect(page.getByLabel('你打算做什么？')).toHaveValue('检查前线补给。');
  await send(page, 'fixture:attributes', initial);
  await send(page, 'fixture:attributes', { ...changed, role: { ...changed.role, power: 1 } });
  await expect(score(page, 'power')).toHaveText('20');

  const unaffiliated = { ...changed, currentFactionId: null, faction: null, version: 3 };
  await send(page, 'fixture:attributes', unaffiliated);
  await expect(panel(page)).toContainText('暂无所属阵营');
  await expect(score(page, 'economy')).toHaveText('—');
  await expect(panel(page).locator('.radar-area-faction')).toHaveCount(0);
  await expect(panel(page).locator('.radar-dot-faction')).toHaveCount(0);
  await send(page, 'fixture:attributes', { ...unaffiliated, role: { ...changed.role, power: 21 }, version: 4 });
  await expect(panel(page).getByRole('alert')).toBeVisible();
  await expect(score(page, 'power')).toHaveText('20');
  await send(page, 'fixture:attributes', { ...changed, version: 5 });
  await expect(panel(page).getByRole('alert')).toHaveCount(0);

  await page.getByRole('button', { name: '提交我的行动' }).click();
  await expect(page.getByRole('button', { name: '投掷 D20' })).toBeEnabled({ timeout: 6000 });
  await page.getByRole('button', { name: '投掷 D20' }).click();
  await page.getByRole('button', { name: '查看我的剧情' }).click();
  const result = await page.locator('.play-outcome strong').textContent();
  await send(page, 'fixture:attributes', { ...changed, role: { ...changed.role, power: 12 }, version: 6 });
  await expect(score(page, 'power')).toHaveText('12');
  await expect(page.locator('.play-outcome strong')).toHaveText(result ?? '');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.play-waiting')).toBeVisible();
});

test('初始读取失败可重试，恢复后显示正常数值', async ({ page }) => {
  await page.goto('/tests/fixtures/player-attributes.html?fail=1');
  await expect(panel(page).getByRole('alert')).toContainText('加载失败');
  await send(page, 'fixture:recover');
  await panel(page).getByRole('button', { name: '重新加载八维' }).click();
  await expect(score(page, 'power')).toHaveText('15');
  await expect(panel(page).getByRole('alert')).toHaveCount(0);
});

test('加载期间的较新推送不会被迟到的旧读取覆盖', async ({ page }) => {
  await page.goto('/tests/fixtures/player-attributes.html?deferred=1');
  await expect(panel(page).getByRole('status')).toBeVisible();
  const initial = initialAttributesFor('lan-wangji');
  await send(page, 'fixture:attributes', { ...initial, role: { ...initial.role, power: 19 }, version: 2 });
  await expect(score(page, 'power')).toHaveText('19');
  await send(page, 'fixture:load', initial);
  await expect(score(page, 'power')).toHaveText('19');
  await expect(panel(page)).toHaveAttribute('aria-busy', 'false');
});
