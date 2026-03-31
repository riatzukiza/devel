# OpenCode Command: deploy-promethean-service

```yaml
name: deploy-promethean-service
description: Bootstrap or repair the full local -> PR -> staging -> PR -> prod Promethean deployment flow for a service
usage: |
  ## Usage
  Say: Deploy <service-name>

  ## Expected meaning
  Treat `Deploy <service-name>` as a request to inspect the target repo and, if needed,
  create or repair the full delivery flow:
  - local development path
  - PR into `staging`
  - push-to-`staging` deploy + live staging verification
  - PR into `main`
  - push-to-`main` production deploy + live production verification

  ## Naming convention
  - staging: staging.<service-name>.promethean.rest
  - production: <service-name>.promethean.rest

  ## Allowed base hosts
  - ussy.promethean.rest
  - ussy2.promethean.rest
  - ussy3.promethean.rest
  - big.ussy.promethean.rest

  ## Required environment
  - CLOUD_FLARE_PROMETHEAN_DOT_REST_DNS_ZONE_TOKEN
  - GitHub auth via `gh` with permissions to manage environments, vars, secrets, and branch protection

  ## Required agent skills
  - promethean-service-deploy
  - promethean-host-slotting
  - promethean-rest-dns
  - pr-promotion-workflows

  ## Minimum outputs
  - staging and production hostnames
  - selected base host(s), runtime paths, and compose-project names
  - GitHub workflows for staging and production promotion/deploy
  - GitHub environment vars/secrets/protection follow-through when access allows it
  - live validation results, not YAML-only edits

  ## Example
  Deploy proxx
```