# BackerTracker Extension by BackerKit

Shows the BackerTracker widget on Kickstarter and BackerKit Crowdfunding
project pages. One Manifest V3 build runs in Chrome, Edge and Firefox.

Indiegogo was supported until 9.3 and was removed in 9.4.

## Development

```sh
npm install
npm run dev          # launch Firefox with the extension, reloading on change
npm run dev:chrome   # same, in Chromium
```

## Tests

```sh
npm test                             # unit tests (Vitest + jsdom)
npx playwright install chromium      # once
npm run test:system                  # loads the extension in Chromium
npm run lint                         # web-ext lint (Firefox/AMO rules)
```

## Releasing

1. Bump `version` in `src/manifest.json` and merge to `master`.
2. Tag the merge commit with the same version and push the tag:

   ```sh
   git tag v9.4 && git push origin v9.4
   ```

The Build extension workflow (`.github/workflows/build.yml`) runs the tests and builds
`dist/backertracker-extension-<version>.zip` on every pull request and push to `master`;
the zip is downloadable from the run's artifacts. It can also be started by hand from the
Actions tab. On a tag it also attaches the zip to a GitHub Release and uploads it to each
store that has credentials set:

| Store           | Account     | Repo secrets                                                | Repo variables        |
| --------------- | ----------- | ----------------------------------------------------------- | --------------------- |
| Firefox Add-ons | maxwell@    | `AMO_JWT_ISSUER`, `AMO_JWT_SECRET`                          |                       |
| Chrome Web Store| greetings@  | `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN` | `CHROME_EXTENSION_ID` |
| Edge Add-ons    |             | `EDGE_CLIENT_ID`, `EDGE_API_KEY`                            | `EDGE_PRODUCT_ID`     |

A store with no credentials is skipped; upload `npm run build`'s zip to it by hand.

Built zips go to `dist/`, which is not committed. Releases up to 9.3 are in git history.
