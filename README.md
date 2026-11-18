# Plazik Website

Modern, playful homepage for SKT "PŁazik".

## Run locally

```sh
bun install --frozen-lockfile
bun run dev
```

## Server build

The site uses the Astro Node adapter with server output (`bun run build`).
Running the built server requires Node.js 24 or newer. It listens on `HOST`
(default `0.0.0.0`) and `PORT` (default `4321`):

```sh
bun run build && bun run start
```

CI also attaches a downloadable `plazik-server-<version>.tar.gz` / `.zip` to
each GitHub release. It contains the built server, `package.json` and
`bun.lock`; run `bun install --frozen-lockfile && bun run start` after
extracting it.

## Data refresh

[`refresh.yml`](.github/workflows/refresh.yml) rebuilds and republishes the image
every 6 hours (and on manual dispatch), tagging it `latest`, `data-<UTC timestamp>`
and `sha-<commit>`. It deliberately creates no GitHub Release and does not change
version tags.

When the API becomes available, fetch it during the build (for example in a
`prebuild` script or directly in an Astro page); the scheduled rebuild will then
pick up new data automatically. No changes to the container are needed.

## Docker

The image runs the Astro server on a non-root distroless Node 24 base — no shell,
no static file server, no Bun installation in the final image:

```sh
docker compose up --build
# http://localhost:8080
```

The JS build stage runs on the host platform, so `linux/amd64` and
`linux/arm64` images are produced without QEMU emulation.

## CI, versions & releases

The [`ci.yml`](.github/workflows/ci.yml) workflow runs on every PR
(opened/updated) and on pushes to `main`, in parallel jobs: version, server
build, container image and GitHub release.

- Container images are published to `ghcr.io/skt-plazik/website` with version,
  `sha-<commit>` and (on `main`) `latest` tags. Fork PRs are built but not pushed.
- Versions follow SemVer 2.0.0, derived from [conventional commits](https://www.conventionalcommits.org/)
  since the last `vX.Y.Z` tag: `feat:` → minor, `fix:`/`perf:`/`revert:`/`refactor:`
  → patch, `!`/`BREAKING CHANGE:` → major, other types → no new release. When no
  tags exist, the version from `package.json` is used as the base.
- PRs get a prerelease `vX.Y.Z-pr<number>` (e.g. `v1.2.3-pr23`), a matching image
  tag, and downloadable server archives attached to the prerelease. Merges to
  `main` create a regular GitHub Release with the same archives.
- Fork PRs cannot publish images/releases, but their server build is available
  as a downloadable Actions artifact.
