# Fork Tales site spec

## Goal

Create `https://fork.tales.promethean.rest` on `big.ussy.promethean.rest` as a retro-futurist interactive story shrine that:

1. hosts Fork Tales narrative and lore artifacts
2. exposes music + lyrics from relevant local collections
3. lets visitors ask the corpus questions through a speaking interface
4. connects the site to the ussy webring

## Aesthetic target

- 90s website trying hard to look futuristic in the 90s
- wired / haunted intranet / anime-adjacent signal terminal
- black, indigo, phosphor cyan, warning amber
- equal parts shrine, archive, and operator console

## Content contract

### Must include

- manuscript chapters / lore documents
- lyrics and song metadata
- playable audio collections
- artwork / cover fragments
- webring widget
- a chat console that answers from the curated corpus

### Must not do

- depend on external JS frameworks/CDNs for the core site
- require Node on the remote host
- expose raw proxy secrets to the browser

## Delivery phases

1. Curate and build a static corpus from local artifacts.
2. Build the retro interactive UI.
3. Add proxy-backed chat with retrieval over the corpus.
4. Deploy to `big.ussy.promethean.rest` behind a rootless Caddy admin route.
5. Create DNS for `fork.tales.promethean.rest`.
6. Register a webring entry pointing at the live site.
7. Verify local and live behavior in a browser.

## Verification

- local build succeeds
- local server serves the site and chat endpoint
- remote process serves `127.0.0.1:8794`
- Caddy route exists for `fork.tales.promethean.rest`
- public HTTPS responds
- webring entry exists
- browser screenshot verifies layout and interaction
