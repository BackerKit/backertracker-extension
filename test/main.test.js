import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const script = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../src/manifest.json', import.meta.url), 'utf8'));

function loadPage(url, body, head = '') {
  const dom = new JSDOM(`<!doctype html><html><head>${head}</head><body>${body}</body></html>`, {
    url,
    runScripts: 'outside-only',
  });
  dom.window.eval(script);
  return dom.window.document;
}

describe('manifest', () => {
  const matches = manifest.content_scripts.flatMap((cs) => cs.matches);

  it('runs on Kickstarter and BackerKit project pages', () => {
    expect(matches).toContain('*://*.kickstarter.com/projects/*');
    expect(matches).toContain('*://*.backerkit.com/c/*');
  });

  it('no longer runs on Indiegogo', () => {
    expect(matches.some((m) => m.includes('indiegogo'))).toBe(false);
  });

  it('declares its data collection for Firefox', () => {
    const gecko = manifest.browser_specific_settings.gecko;
    expect(gecko.data_collection_permissions).toEqual({ required: ['browsingActivity'] });
    expect(gecko.strict_min_version).toBe('140.0');
  });

  it('ships icons at the sizes it declares', () => {
    for (const [size, path] of Object.entries(manifest.icons)) {
      const png = readFileSync(new URL(`../src/${path}`, import.meta.url));
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], path).toEqual([Number(size), Number(size)]);
    }
  });
});

describe('Kickstarter', () => {
  it('inserts the tracker iframe for the project', () => {
    const doc = loadPage(
      'https://www.kickstarter.com/projects/elanlee/exploding-kittens',
      '<div class="NS_projects__content"></div>',
      '<link rel="canonical" href="https://www.kickstarter.com/projects/elanlee/exploding-kittens">'
    );

    const iframes = doc.querySelectorAll('.NS_projects__content iframe.bk-tracker');
    expect(iframes).toHaveLength(1);
    expect(iframes[0].src).toBe('https://www.backerkit.com/projects/elanlee/exploding-kittens/iframe');
  });
});

describe('BackerKit Crowdfunding', () => {
  const head =
    '<meta name="backertracker-canonical" data-url="https://www.kickstarter.com/projects/elanlee/exploding-kittens" data-target="tracker">';

  it('inserts the tracker iframe into the target from the meta tag', () => {
    const doc = loadPage('https://www.backerkit.com/c/projects/exploding-kittens', '<div id="tracker"></div>', head);

    const iframes = doc.querySelectorAll('#tracker iframe.bk-tracker');
    expect(iframes).toHaveLength(1);
    expect(iframes[0].src).toBe('https://www.backerkit.com/projects/elanlee/exploding-kittens/iframe');
  });

  it('does not insert a second iframe on turbo:load', () => {
    const doc = loadPage('https://www.backerkit.com/c/projects/exploding-kittens', '<div id="tracker"></div>', head);

    doc.dispatchEvent(new doc.defaultView.Event('turbo:load'));

    expect(doc.querySelectorAll('iframe.bk-tracker')).toHaveLength(1);
  });
});

describe('Indiegogo (deprecated)', () => {
  it('does not insert a tracker', () => {
    const doc = loadPage(
      'https://www.indiegogo.com/projects/flow-hive',
      '<div class="campaignLayout-midContent"></div>',
      '<link rel="canonical" href="https://www.indiegogo.com/projects/flow-hive">'
    );

    expect(doc.querySelectorAll('iframe.bk-tracker')).toHaveLength(0);
  });
});
