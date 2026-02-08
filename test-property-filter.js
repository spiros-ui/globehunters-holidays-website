const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to hotels page...');
  await page.goto('https://globehunters-holidays-website.vercel.app/hotels?destination=Athens&departureDate=2026-03-15&returnDate=2026-03-22&adults=2&children=0&rooms=1&currency=GBP', {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  
  console.log('Waiting for page content to load...');
  await page.waitForTimeout(3000);
  
  // Take a full page screenshot first
  await page.screenshot({ path: '/tmp/hotels-full-page.png', fullPage: true });
  console.log('Full page screenshot saved to /tmp/hotels-full-page.png');
  
  // Try to find the filters sidebar
  const sidebar = await page.$('[class*="sidebar"], [class*="filter"], aside, .filters, #filters');
  if (sidebar) {
    await sidebar.screenshot({ path: '/tmp/hotels-sidebar.png' });
    console.log('Sidebar screenshot saved to /tmp/hotels-sidebar.png');
  } else {
    console.log('Could not find specific sidebar element, taking viewport screenshot');
    await page.screenshot({ path: '/tmp/hotels-viewport.png' });
  }
  
  // Check for property type filter text
  const pageContent = await page.content();
  const hasPropertyType = pageContent.toLowerCase().includes('property type');
  const hasPropertyTypeFilter = await page.$('text=Property type') || await page.$('text=Property Type');
  
  console.log('\n=== FILTER CHECK ===');
  console.log('Property type text found in page:', hasPropertyType);
  console.log('Property type filter element found:', !!hasPropertyTypeFilter);
  
  // Look for checkboxes in filter area
  const checkboxes = await page.$$('input[type="checkbox"]');
  console.log('Number of checkboxes on page:', checkboxes.length);
  
  await browser.close();
})();
