# PARK / stilloperable

**PARK** is a selection interface for experimental web works.

- [PARK](https://teardrop-site.github.io/park-interactivw/)
- [ORBIT on GitHub Pages](https://teardrop-site.github.io/park-interactivw/orbit/)
- [Original ORBIT host](https://dream.stilloperable.studio/)
- [THE UNWRITTEN (original host)](https://dream.stilloperable.studio/the-unwritten/)

## ORBIT source and publishing

The original ORBIT Astro/React/Three.js source has been restored without rewriting the work, under [orbit-source/](orbit-source/).

A copy of the original source files is checksum-verified from [orbit-archive/](orbit-archive/), using `.github/workflows/build-orbit.yml`.

The GitHub Actions workflow builds ORBIT using Node 22, adjusts **only the temporary build configuration** to support GitHub Pages' `/park-interactivw/orbit/` subpath, and commits compiled output into [orbit/](orbit/). It leaves the original dream.stilloperable.studio site untouched. The root `.nojekyll` file makes it possible to serve Astro's `_astro` assets on GitHub Pages.

To edit the work, modify files in `orbit-source/`. A push to those files triggers a rebuild. The original-source archive is kept as an immutable reference; existing sources are not overwritten on future runs.

## Other works

THE UNWRITTEN currently links to the original host. THE CITY has not yet been published on GitHub; it is deliberately marked as upcoming rather than linked to non-existent code.
