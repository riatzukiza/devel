# Webring Kanban Workflow (ussyco.de)

This repo tracks **ussyco.de webring** work as Trello-synced kanban tasks.

## What counts as “webring work”
- Create a new member site (design + build + register)
- Update/refresh an existing member site
- Audit/verify proxy health + widget rendering

## Where tasks live
- Create tasks in `tasks/incoming/` (or any FSM state directory as you advance it).
- Use the `webring` label so the board can be filtered.

## Create a new site task

### Option A: generator script (recommended)

```bash
cd orgs/ussyverse/kanban
node scripts/new-webring-site-task.mjs \
  --name "Municipal Bureau of Lost Socks" \
  --subdomain "lostsocks" \
  --description "Official retrieval paperwork for mislaid hosiery"
```

This will create a new task file under `tasks/incoming/` with a full checklist.

### Option B: copy the template
Copy `templates/webring-site.task.md` into `tasks/incoming/` and fill it in.

## Operational checklist (what “done” means)
The checklist in the task file is derived from the `webring-site` operational playbook:
- Research existing ring sites (do not copy existing themes)
- Pick concept + aesthetic
- Build a self-contained static `index.html`
- Serve locally on the server
- Register with admin API (`mode: proxy`)
- Verify end-to-end:
  - local server
  - proxy via `:8421`
  - HTTPS subdomain
  - appears in `/api/webring`
  - assets load

## Notes / constraints
- This repo does **not** store the admin API key. Keep it in your environment / secrets.
- Reserved subdomains that will be rejected: `www`, `mail`, `ftp`, `ns1`, `ns2`, `api`, `admin`, `localhost`, `autoconfig`, `autodiscover`, `_dmarc`, `smtp`, `pop`, `imap`, `webmail`, `cpanel`, `whm`.

## References
- Webring API: https://ussyco.de/api/webring
- Hub page: https://ussyco.de/hub/
- Widget JS: https://ussyco.de/api/webring/widget.js
