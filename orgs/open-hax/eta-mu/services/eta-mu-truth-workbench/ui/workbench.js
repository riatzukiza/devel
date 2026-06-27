let selectedTargetKey = '';
let selectedDoc = null;

const el = (id) => document.getElementById(id);

const api = async (method, url, body) => {
  const res = await fetch(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}`);
  return res.json();
};

const renderUnresolved = (items) => {
  const host = el('unresolved');
  host.innerHTML = '';

  const list = document.createElement('div');
  list.className = 'list';

  for (const it of items) {
    const div = document.createElement('div');
    div.className = 'item';

    const top = document.createElement('div');
    top.className = 'row';

    const k = document.createElement('div');
    k.className = 'k';
    k.textContent = it.target_key;
    k.style.flex = '1';

    const c = document.createElement('div');
    c.className = 'muted';
    c.textContent = `x${it.count}`;

    top.appendChild(k);
    top.appendChild(c);
    div.appendChild(top);

    const btnRow = document.createElement('div');
    btnRow.className = 'row';
    btnRow.style.marginTop = '8px';

    const selectBtn = document.createElement('button');
    selectBtn.textContent = selectedTargetKey === it.target_key ? 'selected' : 'select';
    selectBtn.onclick = () => {
      selectedTargetKey = it.target_key;
      selectedDoc = null;
      refresh();
    };

    const resolveBtn = document.createElement('button');
    resolveBtn.textContent = 'resolve →';
    resolveBtn.disabled = !selectedDoc || selectedTargetKey !== it.target_key;
    resolveBtn.onclick = async () => {
      await api('POST', '/api/truth/resolve-wikilink', {
        target_key: it.target_key,
        dst_entity_id: selectedDoc.entity_id,
      });
      await refresh();
    };

    btnRow.appendChild(selectBtn);
    btnRow.appendChild(resolveBtn);
    div.appendChild(btnRow);

    if (Array.isArray(it.examples) && it.examples.length) {
      const ex = document.createElement('div');
      ex.className = 'muted';
      ex.style.marginTop = '8px';
      ex.textContent = it.examples
        .slice(0, 2)
        .map((e) => `${e.src_rel_path}:${e.line}`)
        .join(' · ');
      div.appendChild(ex);
    }

    list.appendChild(div);
  }

  host.appendChild(list);
};

const renderResults = (items) => {
  const host = el('results');
  host.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'list';

  for (const it of items) {
    const div = document.createElement('div');
    div.className = 'item';

    const top = document.createElement('div');
    top.className = 'row';

    const title = document.createElement('div');
    title.style.flex = '1';
    title.textContent = it.title || it.source_rel_path;

    const pick = document.createElement('button');
    const isSel = selectedDoc && selectedDoc.entity_id === it.entity_id;
    pick.textContent = isSel ? 'picked' : 'pick';
    pick.onclick = () => {
      selectedDoc = it;
      refresh();
    };

    top.appendChild(title);
    top.appendChild(pick);
    div.appendChild(top);

    const meta = document.createElement('div');
    meta.className = 'muted';
    meta.textContent = `${it.entity_id} · ${it.source_rel_path}`;
    div.appendChild(meta);

    list.appendChild(div);
  }

  host.appendChild(list);
};

async function refresh() {
  const info = await api('GET', '/api/info');
  el('root-pill').textContent = `root: ${info.vault_root}`;

  const view = await api('GET', '/api/truth/view');
  renderUnresolved(view.unresolved || []);

  const q = el('q').value.trim();
  if (q.length) {
    const results = await api('GET', `/api/search?q=${encodeURIComponent(q)}&limit=30`);
    renderResults(results.hits || []);
  } else {
    renderResults([]);
  }

  el('debug').textContent = JSON.stringify(
    {
      selectedTargetKey,
      selectedDoc,
      unresolved: (view.unresolved || []).slice(0, 3),
      resolutionsCount: Object.keys(view.resolutions || {}).length,
      resolvedEdgesCount: (view.resolvedEdges || []).length,
    },
    null,
    2,
  );
}

el('q').addEventListener('input', () => {
  refresh().catch(console.error);
});

el('rebuild').addEventListener('click', async () => {
  await api('POST', '/api/rebuild', {});
  await refresh();
});

refresh().catch((e) => {
  el('debug').textContent = String(e?.stack || e);
});
