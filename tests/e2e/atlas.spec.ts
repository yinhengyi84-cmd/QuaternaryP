import { test, expect } from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('.province')).toHaveCount(190);});
test('搜索、定位、缩放复位与阵营聚焦',async({page})=>{
  const search=page.getByRole('combobox',{name:'搜索地区'});await search.fill('长沙');await search.press('Enter');await expect(page.getByTestId('region-title')).toHaveText('长沙／潭州');await expect(page.getByTestId('zoom-level')).not.toHaveText('100%');
  await page.getByRole('button',{name:'恢复全图'}).click();await expect(page.getByTestId('zoom-level')).toHaveText('100%');
  await page.getByRole('button',{name:'苏俄 68',exact:true}).click();await expect(page.getByRole('button',{name:'苏俄 68',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('.province').first()).toHaveCSS('opacity','0.19');
  await page.getByRole('button',{name:'显示全部阵营'}).click();await expect(page.locator('.province').first()).toHaveCSS('opacity','1');
});
test('地块点击与拖动不会混淆',async({page})=>{
  const search=page.getByRole('combobox',{name:'搜索地区'});await search.fill('长沙');await search.press('Enter');await expect(page.getByTestId('zoom-level')).toHaveText('1800%');
  const city=page.locator('.province.selected');await city.click();await expect(page.getByTestId('region-title')).toHaveText('长沙／潭州');
  const svg=page.locator('.atlas-map');const box=await svg.boundingBox();await page.mouse.move(box!.x+box!.width*.5,box!.y+box!.height*.5);await page.mouse.down();await page.mouse.move(box!.x+box!.width*.6,box!.y+box!.height*.6,{steps:6});await page.mouse.up();await expect(page.getByTestId('region-title')).toHaveText('长沙／潭州');
});
test('地理志保留合并前的全部故事条目',async({page})=>{
  await page.getByRole('button',{name:'地理志目录',exact:true}).click();await expect(page.locator('.directory-record')).toHaveCount(172);await page.getByRole('textbox',{name:'筛选地理志'}).fill('J008');await page.locator('.directory-record').click();await expect(page.locator('.dossier-meta')).toContainText('J008');await expect(page.locator('.lore-section')).toContainText('东北海岸');await page.getByLabel('关联地理志条目').selectOption('J005');await expect(page.locator('.dossier-meta')).toContainText('J005');await expect(page.locator('.lore-section')).toContainText('冬训');
});
test('手机抽屉、搜索与页面宽度',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.getByRole('combobox',{name:'搜索地区'}).fill('上海');await page.getByRole('combobox',{name:'搜索地区'}).press('Enter');await expect(page.getByTestId('region-title')).toHaveText('上海／申城');await expect(page.locator('.dossier')).toHaveClass(/mobile-open/);await page.getByRole('button',{name:'关闭资料面板'}).click();await expect(page.locator('.dossier')).not.toHaveClass(/mobile-open/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.getByRole('button',{name:'放大地图'}).click();await expect(page.getByTestId('zoom-level')).not.toHaveText('100%');
});
test('加载失败能重试',async({page})=>{
  await page.route('**/data/atlas.json',route=>route.abort());await page.reload();await expect(page.getByRole('heading',{name:'地图加载失败'})).toBeVisible();await page.unroute('**/data/atlas.json');await page.getByRole('button',{name:'重新加载'}).click();await expect(page.locator('.province')).toHaveCount(190);
});
test('六方首都与战略城市可选中，明斯克州使用新别名',async({page})=>{
  await expect(page.locator('.city-marker')).toHaveCount(12);
  await expect(page.locator('.city-marker.capital')).toHaveCount(6);
  await page.getByRole('button',{name:'兰陵，圣彼得堡，首都，拜占庭'}).click();
  await expect(page.getByTestId('region-title')).toHaveText('兰陵');
  await page.getByRole('combobox',{name:'搜索地区'}).fill('合肥·明斯克州');
  await page.getByRole('combobox',{name:'搜索地区'}).press('Enter');
  await expect(page.getByTestId('region-title')).toHaveText('合肥·明斯克州');
  await expect(page.locator('.region-facts')).toContainText('合肥');
});
test.describe('真实触摸事件',()=>{
  test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
  test('双指缩放可用，缩放结束不误选地区',async({page,context})=>{
    const session=await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:170,y:420,id:1},{x:260,y:420,id:2}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:120,y:420,id:1},{x:310,y:420,id:2}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect(page.getByTestId('zoom-level')).not.toHaveText('100%');await expect(page.locator('.province.selected')).toHaveCount(0);
  });
});
