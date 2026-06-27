---
# Template file.
# Copy this into tasks/incoming/ and fill in the placeholders.
uuid: <uuid>
title: "Webring site: <subdomain> — <Display Name>"
status: incoming
priority: P2
labels:
  - webring
  - site
  - ussyco
created_at: <iso8601>
---

## Brief

- Display name: **<Display Name>**
- Subdomain: **<subdomain>.ussyco.de**
- One-line description (hub): <description>

## Constraints (non-negotiable)
- No external CDN dependencies; pure HTML/CSS (vanilla JS only if needed)
- Distinct visual identity (do not duplicate an existing ring member)
- Include the webring widget at the bottom of the page

## Checklist

### 1) Research (MANDATORY)
- [ ] Review current ring members: `curl -s https://ussyco.de/api/webring | python3 -m json.tool`
- [ ] Read 2–3 existing site `index.html` files on the server for vibe range
- [ ] Confirm this concept/aesthetic is not a duplicate

### 2) Concept
- [ ] Absurd premise, played dead serious
- [ ] Niche + specific
- [ ] Collect content ingredients (testimonials, forms, product list, case files, etc.)

### 3) Build
- [ ] Create dir: `mkdir -p /home/mojo/projects/<your-site-name>`
- [ ] Build `index.html` (self-contained)
- [ ] Add webring widget:

```html
<div id="webring" data-theme="dark"></div>
<script src="https://ussyco.de/api/webring/widget.js"></script>
```

### 4) Serve locally (on the server)
- [ ] Choose port (8422–8499) not in use: `ss -tlnp | grep -E ':(84[0-9]{2}|85[0-9]{2})'`
- [ ] Start server:

```bash
nohup python3 -m http.server <PORT> --directory /home/mojo/projects/<your-site-name> > /dev/null 2>&1 &
echo "PID: $!"
```

- [ ] Verify: `curl -s http://localhost:<PORT> | head -10`

### 5) Register in the webring (admin)
- [ ] Confirm subdomain isn’t taken: `curl -s https://ussyco.de/api/webring | python3 -c "import json,sys; d=json.load(sys.stdin); print([s['subdomain'] for s in d['sites']])" | rg '^<subdomain>$' || true`
- [ ] Register member (requires admin key):

```bash
curl -X POST \
  -H "X-Api-Key: <ADMIN_KEY>" \
  -H "Content-Type: application/json" \
  https://ussyco.de/api/admin/members \
  -d '{
    "name": "<Display Name>",
    "subdomain": "<subdomain>",
    "url": "http://localhost:<PORT>",
    "description": "<description>",
    "mode": "proxy",
    "capabilities": {
      "can_redirect": true,
      "can_proxy": true,
      "can_cname": false,
      "can_profile": true
    },
    "theme": "{\"bg\":\"<hex>\",\"text\":\"<hex>\",\"accent\":\"<hex>\",\"border\":\"<hex>\",\"font\":\"<font-stack>\"}"
  }'
```

### 6) Verify end-to-end
- [ ] Local server: `curl -s http://localhost:<PORT> | head -5`
- [ ] Proxy internal: `curl -s -H "X-Subdomain: <subdomain>" http://localhost:8421/api/subdomain/ | head -5`
- [ ] HTTPS live: `curl -s https://<subdomain>.ussyco.de | head -5`
- [ ] Appears in ring: `curl -s https://ussyco.de/api/webring | python3 -c "import json,sys; d=json.load(sys.stdin); print([s['name'] for s in d['sites'] if s['subdomain']=='<subdomain>'])"`
- [ ] Assets load (if any): `curl -s -o /dev/null -w '%{http_code}' https://<subdomain>.ussyco.de/style.css`

## Output
- Live URL: https://<subdomain>.ussyco.de
- Aesthetic notes:
- Verification results:
