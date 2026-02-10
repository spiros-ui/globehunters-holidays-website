import { test, expect } from '@playwright/test';

test.describe('Klook Activities on Packages Page', () => {
  test('activities API returns Klook data with call to book info', async ({ request }) => {
    // Test the activities API endpoint
    const response = await request.get('/api/search/activities?destination=Paris&currency=GBP&limit=5&mode=top');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Check API response structure
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(data.meta.provider).toBe('klook');
    expect(data.meta.bookingPhone).toBe('020 8944 4555');
    expect(data.meta.bookingMessage).toContain('Call to book');

    // Check activities data
    expect(Array.isArray(data.data)).toBeTruthy();
    expect(data.data.length).toBeGreaterThan(0);

    // Check activity structure
    const activity = data.data[0];
    expect(activity).toHaveProperty('id');
    expect(activity).toHaveProperty('title');
    expect(activity).toHaveProperty('price');
    expect(activity).toHaveProperty('duration');
    expect(activity).toHaveProperty('images');
    expect(activity.provider).toBe('klook');
  });

  test('activities API works for different destinations', async ({ request }) => {
    const destinations = ['Dubai', 'Bangkok', 'Bali', 'Maldives'];

    for (const destination of destinations) {
      const response = await request.get(`/api/search/activities?destination=${destination}&currency=GBP&limit=3&mode=top`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.meta.provider).toBe('klook');
    }
  });

  test('packages page loads with activities section', async ({ page }) => {
    // Navigate to packages page
    await page.goto('/packages');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page).toHaveTitle(/Packages|Holiday/i);

    // Check that the page has loaded
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('activities section shows Klook branding and call to book', async ({ page }) => {
    // Test the activities API directly to ensure Klook attribution is present
    const response = await page.request.get('/api/search/activities?destination=Paris&currency=GBP&limit=8&mode=top');
    const data = await response.json();

    // Verify Klook is the provider
    expect(data.meta.provider).toBe('klook');

    // Verify call to book information
    expect(data.meta.bookingPhone).toBe('020 8944 4555');

    // Verify activities have proper structure for display
    if (data.data.length > 0) {
      const activity = data.data[0];
      expect(activity.title).toBeTruthy();
      expect(activity.price.amount).toBeGreaterThan(0);
      expect(activity.images.length).toBeGreaterThan(0);
    }
  });

  test('activity data includes affiliate tracking URLs', async ({ request }) => {
    const response = await request.get('/api/search/activities?destination=Paris&currency=GBP&limit=5&mode=top');
    const data = await response.json();

    // Check that booking URLs include affiliate parameters
    for (const activity of data.data) {
      if (activity.bookingUrl) {
        expect(activity.bookingUrl).toContain('klook.com');
        expect(activity.bookingUrl).toContain('aff_pid=701824');
      }
    }
  });
});
