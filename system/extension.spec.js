import { test as base, expect, chromium } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const extensionPath = new URL('../src', import.meta.url).pathname;

// Loads the unpacked extension into a real Chromium. Site pages are served
// from stubs via request routing so the content script runs against their
// real URLs without hitting the network.
const test = base.extend({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'bk-tracker-')), {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await context.route('https://www.backerkit.com/projects/**/iframe', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<p>tracker</p>' })
    );
    await use(context);
    await context.close();
  },
});

function stubPage(context, url, { head = '', body }) {
  return context.route(url, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html><head>${head}</head><body>${body}</body></html>`,
    })
  );
}

test('shows the tracker on a Kickstarter project', async ({ context }) => {
  const url = 'https://www.kickstarter.com/projects/elanlee/exploding-kittens';
  await stubPage(context, url, {
    head: `<link rel="canonical" href="${url}">`,
    body: '<div class="NS_projects__content"></div>',
  });

  const page = await context.newPage();
  await page.goto(url);

  const iframe = page.locator('.NS_projects__content iframe.bk-tracker');
  await expect(iframe).toHaveAttribute('src', 'https://www.backerkit.com/projects/elanlee/exploding-kittens/iframe');
  await expect(page.frameLocator('iframe.bk-tracker').getByText('tracker')).toBeVisible();
});

test('shows the tracker on a BackerKit Crowdfunding project', async ({ context }) => {
  const url = 'https://www.backerkit.com/c/projects/exploding-kittens';
  await stubPage(context, url, {
    head: '<meta name="backertracker-canonical" data-url="https://www.kickstarter.com/projects/elanlee/exploding-kittens" data-target="tracker">',
    body: '<div id="tracker"></div>',
  });

  const page = await context.newPage();
  await page.goto(url);

  await expect(page.locator('#tracker iframe.bk-tracker')).toHaveCount(1);
});

test('does nothing on Indiegogo', async ({ context }) => {
  const url = 'https://www.indiegogo.com/projects/flow-hive';
  await stubPage(context, url, {
    head: `<link rel="canonical" href="${url}">`,
    body: '<div class="campaignLayout-midContent"></div>',
  });

  const page = await context.newPage();
  await page.goto(url);
  await page.waitForLoadState('load');

  await expect(page.locator('iframe.bk-tracker')).toHaveCount(0);
});
