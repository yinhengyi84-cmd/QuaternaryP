import { test, expect } from '@playwright/test';

for(const viewport of [{width:390,height:844},{width:320,height:740},{width:844,height:390},{width:1440,height:900}]) {
  test(`地区名称可读、随缩放增大且避让标牌 ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.goto('/#/atlas');
    await expect(page.locator('.province')).toHaveCount(190);
    const zoom=page.getByRole('button',{name:'放大地图'});
    await zoom.click();await zoom.click();
    const labels=page.locator('.province-label');
    await expect.poll(()=>labels.count()).toBeGreaterThan(0);
    // 使用真实 SVG 到屏幕的变换测字号，能识别 viewBox 在手机上把文字缩小的问题。
    const screenFont=()=>labels.first().evaluate(element=>{
      const text=element as SVGTextElement;
      const matrix=text.getScreenCTM()!;
      return parseFloat(getComputedStyle(text).fontSize)*Math.hypot(matrix.a,matrix.b);
    });
    const before=await screenFont();
    expect(before).toBeGreaterThanOrEqual(11.9);
    await zoom.click();
    await expect.poll(screenFont).toBeGreaterThan(before+.5);
    await zoom.click();
    const layout=await page.evaluate(()=>{
      const rect=(el:Element)=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom};};
      return {
        svg:rect(document.querySelector('.atlas-map')!),
        labels:Array.from(document.querySelectorAll('.province-label'),rect),
        cities:Array.from(document.querySelectorAll('.city-label rect'),rect),
      };
    });
    const overlaps=(a:typeof layout.svg,b:typeof layout.svg)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    for(const [index,label] of layout.labels.entries()) {
      expect(label.left).toBeGreaterThanOrEqual(layout.svg.left);
      expect(label.right).toBeLessThanOrEqual(layout.svg.right);
      expect(layout.labels.slice(index+1).some(other=>overlaps(label,other))).toBe(false);
      expect(layout.cities.some(city=>overlaps(label,city))).toBe(false);
    }
    await page.screenshot({path:test.info().outputPath('labels.png')});
    await page.getByRole('button',{name:'恢复全图'}).click();
    await expect(page.getByTestId('zoom-level')).toHaveText('100%');
    if(viewport.width<500)await expect(labels).toHaveCount(0);
  });
}
