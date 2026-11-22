# PARK / stilloperable

**PARK** is the index of interactive web works.

- [PARK](https://teardrop-site.github.io/park-interactivw/)
- [ORBIT, original-source GitHub edition](https://teardrop-site.github.io/park-interactivw/orbit/)
- [THE UNWRITTEN, original host](https://dream.stilloperable.studio/the-unwritten/)
- [DREAM KEEP DREAMIN', GitHub edition](https://teardrop-site.github.io/park-interactivw/city/)
- [ALMOST / ためらいの地図 (original interactive cartography)](https://teardrop-site.github.io/park-interactivw/almost.html)

## New original work

`almost/index.html` is a self-contained mobile-friendly canvas experiment. Holding on the map creates landforms; selecting islands reveals written field notes. Its drawing data stays in this browser's localStorage and can be exported as PNG. No analytics, external scripts, dependencies, or server-side data collection.

## Source preservation

The original ORBIT Astro/React/Three.js project is under `orbit-source/`. DREAM KEEP DREAMIN' uses its original Vite/TypeScript/Three.js project under `city-source/`. Source archives are retained in `orbit-archive/` and `city-archive/` with checksum-verified restoration.

## Automatic publication

- `.github/workflows/build-orbit.yml`: build the original ORBIT for `/park-interactivw/orbit/`
- `.github/workflows/build-city.yml`: build DREAM KEEP DREAMIN' for `/park-interactivw/city/`
- `index.html`: PARK navigation

Both builds run in isolated temporary build folders. The original source and the existing `dream.stilloperable.studio` host are not modified. The output is committed into `orbit/` and `city/` to be served from the root GitHub Pages deployment. The root `.nojekyll` file enables Astro `_astro` assets.

THE UNWRITTEN still links to its original host until its actual source becomes available.
