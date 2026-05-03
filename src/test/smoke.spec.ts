import { test, expect } from '@playwright/test';

test.describe('NetVis E2E Smoke Tests', () => {
  test('homepage loads and shows critical UI', async ({ page }) => {
    await page.goto('/');
    
    // Check main title or key element
    await expect(page.locator('text=NETVIS')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('selecting a model updates the canvas label', async ({ page }) => {
    await page.goto('/');
    
    // Open dropdown
    await page.click('button:has-text("MLP")'); 
    
    // Select ResNet
    await page.click('text=ResNet-50');
    
    // Check if some indicator of ResNet appears (e.g. in Sidebar or Info Panel)
    await expect(page.locator('text=ResNet-50')).toBeVisible();
  });

  test('clicking Train starts the simulation', async ({ page }) => {
    await page.goto('/');
    
    const trainBtn = page.locator('button:has-text("Train Model")');
    await expect(trainBtn).toBeEnabled();
    
    await trainBtn.click();
    
    // Button should change to Stop
    await expect(page.locator('button:has-text("Stop Training")')).toBeVisible();
  });
});
