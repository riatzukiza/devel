const els = {
  resolved: document.getElementById('resolved-count'),
  edges: document.getElementById('edge-count'),
  unresolved: document.getElementById('unresolved-count'),
  examples: document.getElementById('example-count'),
  quote: document.getElementById('signal-quote'),
  subtext: document.getElementById('signal-subtext'),
  controlVaults: document.getElementById('control-vaults'),
};

const formatNumber = (value) => Intl.NumberFormat('en-US').format(value);

const animateValue = (node, next) => {
  if (!node) return;
  const current = Number(node.dataset.value ?? 0);
  const target = Number(next);
  node.dataset.value = String(target);

  const start = performance.now();
  const duration = 720;

  const step = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(current + (target - current) * eased);
    node.textContent = formatNumber(value);
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
};

const chooseInterpretation = ({ mounted, resolvedCount, resolvedEdgesCount, unresolvedCount, unresolvedExamples }) => {
  if (!mounted) {
    return {
      quote: 'The crystal is awake. The field is waiting for its first mount.',
      subtext: 'The public surface is ready; the underlying document substrate has not been attached yet.'
    };
  }

  if (unresolvedCount === 0) {
    return {
      quote: 'The crystal is clear enough to move without flinching.',
      subtext: `${resolvedCount} resolved truths anchor ${resolvedEdgesCount} visible relations. The field is calm, not empty.`
    };
  }

  if (unresolvedCount <= 3) {
    return {
      quote: 'A few knots remain. Enough to guide attention, not enough to drown the song.',
      subtext: `${unresolvedCount} unresolved targets remain across ${unresolvedExamples} open examples. This is a field asking for precise movement.`
    };
  }

  return {
    quote: 'The field is speaking in several directions at once. Listen, then step with intent.',
    subtext: `${unresolvedCount} unresolved targets and ${unresolvedExamples} open examples suggest living drift. Movement should be deliberate, not frantic.`
  };
};

const api = async (url) => {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`GET ${url} -> ${response.status}`);
  return response.json();
};

const prettyState = (value) => String(value || 'unknown').replaceAll('-', ' ');

const renderVaultCards = (vaults) => {
  if (!els.controlVaults) return;

  els.controlVaults.innerHTML = '';
  const items = Array.isArray(vaults) ? vaults : [];

  for (const state of items) {
    const card = document.createElement('article');
    card.className = 'card manifest-text';

    const blockers = Array.isArray(state.blocking_reasons) && state.blocking_reasons.length > 0
      ? state.blocking_reasons.join(' · ')
      : 'none';

    const pr = state.main_promotion ?? state.current_pr;
    const stagingDeploy = state.staging?.checks?.['deploy-staging'] ?? state.main_branch?.latest_push_pipeline?.conclusion ?? 'n/a';
    const stagingE2e = state.staging?.checks?.['staging-live-e2e'] ?? 'n/a';
    const reviewSignals = pr?.review_signals ?? state.main_promotion?.review_signals ?? null;
    const reviewDebt = reviewSignals?.exact
      ? `${reviewSignals.tracked_unresolved_threads}/${reviewSignals.tracked_total_threads} tracked unresolved/total threads`
      : reviewSignals?.note ?? 'not available';

    card.innerHTML = `
      <div class="label">Live vault state · ${state.vault?.display_name ?? state.vault?.id ?? 'vault'}</div>
      <h3>${state.vault?.display_name ?? state.vault?.id}: ${prettyState(state.stage)} (${prettyState(state.status)})</h3>
      <p>${state.summary ?? 'No active summary yet.'}</p>
      <p><strong>Repo:</strong> ${state.vault?.repo ?? 'unknown'} &nbsp;·&nbsp; <strong>Flow:</strong> ${prettyState(state.vault?.flow_kind ?? 'unknown')}</p>
      <p><strong>Promotion PR:</strong> ${pr ? `#${pr.number} ${pr.title}` : 'none open'}</p>
      <p><strong>Staging / pipeline:</strong> ${prettyState(stagingDeploy)} &nbsp;·&nbsp; <strong>E2E:</strong> ${prettyState(stagingE2e)}</p>
      <p><strong>Review debt:</strong> ${reviewDebt}</p>
      <p><strong>Blocking reasons:</strong> ${blockers}</p>
      <p><strong>Next μ:</strong> ${state.next_action ?? 'wait for the next seed'}</p>
    `;

    els.controlVaults.appendChild(card);
  }
};

const renderControlPlane = async () => {
  const payload = await api('/api/control-plane/vaults');
  renderVaultCards(payload.vaults ?? []);
};

const refresh = async () => {
  const overview = await api('/api/site/overview');

  const resolvedCount = Number(overview.resolved_count ?? 0);
  const resolvedEdgesCount = Number(overview.resolved_edges_count ?? 0);
  const unresolvedCount = Number(overview.unresolved_count ?? 0);
  const unresolvedExamples = Number(overview.unresolved_examples_count ?? 0);

  animateValue(els.resolved, resolvedCount);
  animateValue(els.edges, resolvedEdgesCount);
  animateValue(els.unresolved, unresolvedCount);
  animateValue(els.examples, unresolvedExamples);

  const interpretation = chooseInterpretation({
    mounted: Boolean(overview.mounted),
    resolvedCount,
    resolvedEdgesCount,
    unresolvedCount,
    unresolvedExamples,
  });

  if (els.quote) els.quote.textContent = interpretation.quote;
  if (els.subtext) {
    const mountPath = overview.mounts_path || 'ημ.mounts.v1';
    const mountNote = overview.mounted ? 'mounted' : 'waiting for first mount';
    els.subtext.textContent = `${interpretation.subtext} Substrate: ${mountPath} (${mountNote}). ${overview.note || ''}`.trim();
  }

  await renderControlPlane();
};

refresh().catch((error) => {
  if (els.quote) {
    els.quote.textContent = 'The field is present, but the signal path is not yet complete.';
  }
  if (els.subtext) {
    els.subtext.textContent = String(error?.message || error);
  }
  if (els.controlVaults) {
    els.controlVaults.innerHTML = `<article class="card manifest-text"><div class="label">Live vault state</div><h3>Control plane unavailable</h3><p>${String(error?.message || error)}</p></article>`;
  }
});
