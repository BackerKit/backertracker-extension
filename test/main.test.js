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

  it('does nothing when the page has no canonical link', () => {
    const doc = loadPage(
      'https://www.kickstarter.com/projects/elanlee/exploding-kittens',
      '<div class="NS_projects__content"></div>'
    );

    expect(doc.querySelectorAll('iframe.bk-tracker')).toHaveLength(0);
  });

  it('does nothing on the creator bio page', () => {
    const doc = loadPage(
      'https://www.kickstarter.com/projects/elanlee/exploding-kittens/creator_bio',
      '<div class="NS_projects__content"></div>',
      '<link rel="canonical" href="https://www.kickstarter.com/projects/elanlee/exploding-kittens/creator_bio">'
    );

    expect(doc.querySelectorAll('iframe.bk-tracker')).toHaveLength(0);
  });

  it('sizes the iframe to its container instead of a fixed pixel width', () => {
    const doc = loadPage(
      'https://www.kickstarter.com/projects/elanlee/exploding-kittens',
      '<div class="NS_projects__content"></div>',
      '<link rel="canonical" href="https://www.kickstarter.com/projects/elanlee/exploding-kittens">'
    );

    const iframe = doc.querySelector('iframe.bk-tracker');
    expect(iframe.style.width).toBe('100%');
    expect(iframe.style.height).toBe('435px');
    expect(iframe.style.borderStyle).toBe('none');
    expect(iframe.hasAttribute('frameborder')).toBe(false);
  });

  it('does not add a second tracker when one is already on the page', () => {
    const doc = loadPage(
      'https://www.kickstarter.com/projects/elanlee/exploding-kittens',
      '<iframe class="bk-tracker"></iframe><div class="NS_projects__content"></div>',
      '<link rel="canonical" href="https://www.kickstarter.com/projects/elanlee/exploding-kittens">'
    );

    expect(doc.querySelectorAll('iframe.bk-tracker')).toHaveLength(1);
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

  it('renders again after Turbo swaps in a new body', () => {
    const doc = loadPage('https://www.backerkit.com/c/projects/exploding-kittens', '<div id="tracker"></div>', head);

    doc.body.innerHTML = '<div id="tracker"></div>';
    doc.dispatchEvent(new doc.defaultView.Event('turbo:load'));

    expect(doc.querySelectorAll('#tracker iframe.bk-tracker')).toHaveLength(1);
  });

  it('finds a target whose id is not a valid CSS selector', () => {
    const doc = loadPage(
      'https://www.backerkit.com/c/projects/exploding-kittens',
      '<div id="tracker:main"></div>',
      head.replace('data-target="tracker"', 'data-target="tracker:main"')
    );

    expect(doc.getElementById('tracker:main').querySelectorAll('iframe.bk-tracker')).toHaveLength(1);
  });

  it('accepts a relative url in the meta tag', () => {
    const doc = loadPage(
      'https://www.backerkit.com/c/projects/exploding-kittens',
      '<div id="tracker"></div>',
      '<meta name="backertracker-canonical" data-url="/projects/exploding-kittens" data-target="tracker">'
    );

    expect(doc.querySelector('#tracker iframe.bk-tracker').src).toBe(
      'https://www.backerkit.com/projects/exploding-kittens/iframe'
    );
  });

  it('does nothing when the meta tag has no url', () => {
    const doc = loadPage(
      'https://www.backerkit.com/c/projects/exploding-kittens',
      '<div id="tracker"></div>',
      '<meta name="backertracker-canonical" data-target="tracker">'
    );

    expect(doc.querySelectorAll('iframe.bk-tracker')).toHaveLength(0);
  });

  it('is detected by hostname, not by text anywhere in the URL', () => {
    const doc = loadPage(
      'https://www.backerkit.com/c/projects/kickstarter.com-favorites',
      '<div id="tracker"></div>',
      head
    );

    expect(doc.querySelectorAll('#tracker iframe.bk-tracker')).toHaveLength(1);
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
