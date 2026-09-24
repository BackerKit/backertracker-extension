(() => {
    const BACKERKIT_ROOT = 'https://www.backerkit.com';

    // Each site returns the project URL the tracker is for and the element
    // to prepend it to, or null when this page shouldn't get a tracker.
    const sites = [
        {
            matches: (host) => host.endsWith('kickstarter.com'),
            find() {
                const url = document.querySelector('link[rel="canonical"]')?.href;
                if (!url || url.includes('creator_bio')) {
                    return null;
                }
                const target = document.querySelector(
                    '.NS_projects__hero_funding .container-flex, .NS_projects__hero_spotlight .container-flex, .NS_projects__content'
                );
                return { url, target };
            },
        },
        {
            matches: (host) => host.endsWith('backerkit.com'),
            find() {
                const meta = document.querySelector('meta[name="backertracker-canonical"]');
                if (!meta?.dataset.url || !meta.dataset.target) {
                    return null;
                }
                return { url: meta.dataset.url, target: document.getElementById(meta.dataset.target) };
            },
        },
    ];

    function insertTracker({ url, target }) {
        if (!target || document.querySelector('iframe.bk-tracker')) {
            return;
        }
        const { pathname } = new URL(url, location.href);
        if (!pathname.includes('/projects')) {
            return;
        }

        const iframe = document.createElement('iframe');
        iframe.src = `${BACKERKIT_ROOT}${pathname}/iframe`;
        iframe.className = 'bk-tracker';
        iframe.scrolling = 'no';
        iframe.style.cssText = 'border: 0; width: 100%; height: 435px; margin: 10px auto;';
        target.prepend(iframe);
    }

    function run() {
        const site = sites.find((s) => s.matches(location.hostname));
        const placement = site?.find();
        if (placement) {
            insertTracker(placement);
        }
    }

    run();

    // BackerKit Crowdfunding uses Turbo Drive, which swaps the <body> on in-app
    // navigation without a full document load. Without this, the tracker would
    // only appear on a hard refresh. Re-run on each Turbo visit so it also
    // renders when navigating to a project page from within the site.
    document.addEventListener('turbo:load', run);
})();
