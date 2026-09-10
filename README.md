# Simulateur TH

Static React app for logging hourly work periods and generating Facnet/RAMQ request models.

## Run Locally

Prerequisite: Node.js 22 or newer.

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The static site is generated in `dist/`.

## Publish Free On GitHub Pages

1. Push this repository to GitHub.
2. In the GitHub repository, open **Settings > Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` or `master`, or run the **Deploy to GitHub Pages** workflow manually.

The app has no backend requirement and no API key requirement. It can be hosted as a static page on GitHub Pages.
