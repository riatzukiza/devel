---
original_name: "2026.04.17.14.54.41.md"
title: "Knoxx Admin UI Cleanup Tasks"
summary: "Lists UI cleanup tasks for Knoxx admin pages, settings API errors, nav removal, and page compaction."
category: "dev"
created: "2026-04-17"
---

1. remove the legacy admin nav button
2. The contracts page needs to fill the full vertical length of the page.
3. move the `Workbecnh` into pseudo
   1. remove the workbench top nav item
   2. remove the admin panel `Dashboard` side nav item
4. break down the page at https://knoxx.promethean.rest/ops/admin into multiple new admin pages
5. Make all the new pages more compact than the current layout.
6. Fix the settings page:
```
 Firefox can’t establish a connection to the server at wss://knoxx.promethean.rest/ws/stream. ws.ts:30:14
The connection to wss://knoxx.promethean.rest/ws/stream was interrupted while the page was loading. ws.ts:30:14
XHRGET
https://knoxx.promethean.rest/api/settings
[HTTP/2 404  238ms]

XHRGET
https://knoxx.promethean.rest/api/settings/knoxx-status
[HTTP/2 404  128ms]

XHRGET
https://knoxx.promethean.rest/api/settings/knoxx-status
[HTTP/2 404  117ms]

XHRGET
https://knoxx.promethean.rest/api/settings
[HTTP/2 404  236ms]

Error: Failed to load Knoxx status
    getKnoxxStatus nextApi.ts:110
    loadSettings SettingsPage.tsx:21
    SettingsPage SettingsPage.tsx:16
    React 7
    workLoop scheduler.development.js:266
    flushWork scheduler.development.js:239
    performWorkUntilDeadline scheduler.development.js:533
    scheduler chunk-AOKPZIF4.js:405
    scheduler chunk-AOKPZIF4.js:453
    __require chunk-DC5AMYBS.js:9
    scheduler chunk-AOKPZIF4.js:465
    __require chunk-DC5AMYBS.js:9
    React 2
    __require chunk-DC5AMYBS.js:9
    dom React
    __require chunk-DC5AMYBS.js:9
    dom React
    __require chunk-DC5AMYBS.js:9
    <anonymous> react-dom_client.js:38
SettingsPage.tsx:46:15
Error: Failed to load Knoxx status
    getKnoxxStatus nextApi.ts:110
    loadSettings SettingsPage.tsx:21
    SettingsPage SettingsPage.tsx:16
    React 8
    workLoop scheduler.development.js:266
    flushWork scheduler.development.js:239
    performWorkUntilDeadline scheduler.development.js:533
    scheduler chunk-AOKPZIF4.js:405
    scheduler chunk-AOKPZIF4.js:453
    __require chunk-DC5AMYBS.js:9
    scheduler chunk-AOKPZIF4.js:465
    __require chunk-DC5AMYBS.js:9
    React 2
    __require chunk-DC5AMYBS.js:9
    dom React
    __require chunk-DC5AMYBS.js:9
    dom React
    __require chunk-DC5AMYBS.js:9
    <anonymous> react-dom_client.js:38
SettingsPage.tsx:46:15

```
