import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  console.log('Navigating to hotels page...');
  await page.goto('https://globehunters-holidays-website.vercel.app/hotels?destination=Athens&departureDate=2026-03-15&returnDate=2026-03-22&adults=2&children=0&rooms=1&currency=GBP', {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  
  console.log('Waiting for page content to load...');
  await page.waitForTimeout(3000);
  
  // Find and screenshot just the left portion of the page (filters)
  await page.screenshot({ 
    path: '/tmp/hotels-sidebar-focus.png', 
    clip: { x: 0, y: 100, width: 350, height: 800 }
  });
  console.log('Sidebar screenshot saved to /tmp/hotels-sidebar-focus.png');
  
  // Get all filter section headings
  const filterHeadings = await page.$$eval('h3, h4, [class*="heading"], [class*="title"]', 
    els => els.map(e => e.textContent?.trim()).filter(t => t && t.length < 50)
  );
  console.log('\nFilter headings found:', filterHeadings.slice(0, 15));
  
  // Look for property type specifically
  const propertyTypeSection = await page.$('text=Property type');
  if (propertyTypeSection) {
    const box = await propertyTypeSection.boundingBox();
    if (box) {
      await page.screenshot({ 
        path: '/tmp/property-type-section.png', 
        clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 10), width: 320, height: 400 }
      });
      console.log('Property type section screenshot saved to /tmp/property-type-section.png');
    }
  }
  
  // Get all checkbox labels in filters
  const checkboxLabels = await page.$$eval('label', 
    labels => labels.map(l => l.textContent?.trim()).filter(t => t && t.length > 0 && t.length < 50)
  );
  console.log('\nCheckbox labels found:', checkboxLabels.slice(0, 20));
  
  await browser.close();
})();
