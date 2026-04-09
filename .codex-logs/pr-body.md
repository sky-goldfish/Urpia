## What changed
- migrated the avatar/explore map flows from Mapbox runtime usage to AMap JS API
- added shared AMap loader/config, 2D-first 3D map overlays, and indoor route wiring
- replaced local env examples with AMap key/security code guidance and removed mapbox-gl dependency

## Why
- the Mapbox-backed avatar map required a VPN and was not reliable for local use
- this switches the frontend map experience to AMap with the provided JS API key model

## Impact
- map entry, explore map, 3D map, and indoor POI routes now build and route correctly
- local runtime uses AMap credentials from .env.local instead of Mapbox token config

## Validation
- npm run build
- local dev server smoke check for /map-entry, /map, /map-3d, /poi/poi-1/indoor (HTTP 200)
- git grep on src/.env.example/package.json confirmed no Mapbox runtime references remain

## Notes
- the nested `Xiaohongshu/` repo in the workspace was intentionally excluded from this PR
- full visual interaction verification still depends on opening the pages in a browser with the configured local AMap credentials
