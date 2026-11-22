# PARK / stilloperable

**PARK** is the index of interactive web works.

- [PARK](https://teardrop-site.github.io/park-interactivw/)
- [ORBIT, original-source GitHub edition](https://teardrop-site.github.io/park-interactivw/orbit/)
- [THE UNWRITTEN, original host](https://dream.stilloperable.studio/the-unwritten/)
- [DREAM KEEP DREAMIN', GitHub edition](https://teardrop-site.github.io/park-interactivw/city/)
- [ALMOST / ためらいの地図 (original interactive cartography)](https://teardrop-site.github.io/park-interactivw/almost.html)

## New original work

`almost/index.html` is a self-contained, mobile-friendly canvas experiment, also served as `almost.html`. Hold for 0.8 seconds to create an island, tap an island to read its field note, and tap the water between two or more islands to reveal a geographic relationship between the closest pair. At three islands, a **Route** control becomes available: the visitor's actual island placement determines a shortest-neighbor visiting order, and each press advances a narrative passage along the visible route. At 14 islands, that route connects the full map and returns to its first stop. Placement data stays in the current browser's localStorage, with PNG export. No analytics, external scripts, dependencies, or server-side data collection.

## Source preservation

The original ORBIT Astro/React/Three.js project is under `orbit-source/`. DREAM KEEP DREAMIN' uses its original Vite/TypeScript/Three.js project under `city-source/`. Source archives are retained in `orbit-archive/` and `city-archive/` with checksum-verified restoration.

## Automatic publication

- `.github/workflows/build-orbit.yml`: build the original ORBIT for `/park-interactivw/orbit/`
- `.github/workflows/build-city.yml`: build DREAM KEEP DREAMIN' for `/park-interactivw/city/`
- `index.html`: PARK navigation

Both builds run in isolated temporary build folders. The original source and the existing `dream.stilloperable.studio` host are not modified. The output is committed into `orbit/` and `city/` to be served from the root GitHub Pages deployment. The root `.nojekyll` file enables Astro `_astro` assets.

THE UNWRITTEN still links to its original host until its actual source becomes available.

## GitHub Pages deployment

Publishing is managed by the [Publish PARK to GitHub Pages](.github/workflows/publish-pages.yml) workflow. The repository's Pages source must be set to **GitHub Actions**. A push to `main` rebuilds the public artifact containing the PARK index and original works.
