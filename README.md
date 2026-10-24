# Cinema Home

A lightweight, English-language cinematic launcher module for TizenBrew. Six direct shortcuts, a landscape backdrop, remote navigation, and no promotional feed.

## Install

In TizenBrew, open Module Manager and add the GitHub module:

`Karmani-MR/cinema-tv-home@v1.0.0`

Open **Cinema Home** from the modules screen. After confirming the shortcuts work, optionally select it under Settings → AutoLaunch Settings. Hold Up while TizenBrew starts to bypass its automatic launch.

This is a home screen inside TizenBrew. It does not root the TV, replace Samsung's Home button, modify firmware, or remove advertisements inside subscription streaming apps. YouTube uses the separately installed TizenTube module.

## TV compatibility

The companion uses ES5-compatible JavaScript and Node built-ins. The UI avoids optional chaining, CSS backdrop filters, flex gap, and other features absent from older TV browsers. The primary target is Tizen 5.5 with a 1920 × 1080 web viewport. Actual-device testing is required before making it a default launcher.

Supported shortcuts: YouTube/TizenTube, Netflix, HBO Max, Prime Video, Apple TV, YouTube TV, TV Inputs, and TV Settings. App availability and identifiers can vary by model and region.

## Privacy and security

- No analytics, login forms, advertising, viewing-history storage, or account access.
- Public files contain no device addresses, device identifiers, credentials, or account data.
- The companion listens only on the TV's loopback interface, `127.0.0.1:8097`, not Wi-Fi.
- Native-app launches are restricted to a fixed allowlist and require an ephemeral session token.
- Browser previews never attempt a connection to the TV.
- Code and visual assets load through TizenBrew's module CDN. As with any TizenBrew module, install only from sources you trust.

## Attribution

- Landscape by Karsten Winegeart, used under the Unsplash License: https://unsplash.com/photos/mountains-reflect-in-a-dark-wet-landscape-24h4vWNHjJE
- Manrope by the Manrope Project Authors, SIL Open Font License, bundled license in `assets/FONT-LICENSE.txt`: https://github.com/sharanda/manrope
- Netflix, Prime Video and YouTube identifying marks from https://github.com/gramosukaj/tizenbrew-launcher, commit `cbf52aa4972cd9f31e0209f40a47ca3940d40b15`. All marks belong to their respective owners and identify the original apps; no affiliation is claimed.
- TizenBrew project and installation guide: https://github.com/reisxd/TizenBrew/blob/main/docs/README.md
- App-launch integration follows the MIT-licensed launcher example at https://github.com/gramosukaj/tizenbrew-launcher.

Source code is MIT-licensed. Third-party photographs, fonts, and marks retain their original terms.
