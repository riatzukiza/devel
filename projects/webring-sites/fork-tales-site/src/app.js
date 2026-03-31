const state = {
  library: null,
  docsById: new Map(),
  audioById: new Map(),
  playlistById: new Map(),
  currentDocId: null,
  currentTrackId: null,
  currentFilter: 'all',
  currentPlaylistId: 'all',
  search: '',
  chatHistory: [],
  latestCitations: [],
  ambientTimer: null,
  audioAnalyser: null,
  audioContext: null,
  audioSource: null,
  visualizerFrame: 0,
};

const elements = {
  bootOverlay: document.getElementById('boot-overlay'),
  bootEnter: document.getElementById('boot-enter'),
  statsRow: document.getElementById('stats-row'),
  promptButtons: document.getElementById('prompt-buttons'),
  filterChipRow: document.getElementById('filter-chip-row'),
  searchInput: document.getElementById('search-input'),
  chapterList: document.getElementById('chapter-list'),
  docList: document.getElementById('doc-list'),
  readerKind: document.getElementById('reader-kind'),
  readerTitle: document.getElementById('reader-title'),
  readerMeta: document.getElementById('reader-meta'),
  readerContent: document.getElementById('reader-content'),
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  chatLog: document.getElementById('chat-log'),
  chatStatus: document.getElementById('chat-status'),
  clearChat: document.getElementById('clear-chat'),
  speakToggle: document.getElementById('speak-toggle'),
  citationDock: document.getElementById('citation-dock'),
  audioPlayer: document.getElementById('audio-player'),
  coverArt: document.getElementById('cover-art'),
  coverFallback: document.getElementById('cover-fallback'),
  visualizer: document.getElementById('visualizer'),
  trackCollection: document.getElementById('track-collection'),
  trackTitle: document.getElementById('track-title'),
  trackExcerpt: document.getElementById('track-excerpt'),
  trackList: document.getElementById('track-list'),
  lyricsPanel: document.getElementById('lyrics-panel'),
  playlistRow: document.getElementById('playlist-row'),
  ambientQuote: document.getElementById('ambient-quote'),
  artifactJump: document.getElementById('artifact-jump'),
  rosterList: document.getElementById('roster-list'),
  galleryGrid: document.getElementById('gallery-grid'),
  statusMode: document.getElementById('status-mode'),
  statusActive: document.getElementById('status-active'),
};

const ctx = elements.visualizer.getContext('2d');

function prettyKind(kind) {
  return String(kind || 'signal').replace(/-/g, ' ');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function summarizePath(path) {
  const parts = String(path || '').split('/');
  return parts.slice(-3).join('/');
}

async function loadLibrary() {
  const response = await fetch('content/library.json');
  if (!response.ok) {
    throw new Error(`library load failed: ${response.status}`);
  }
  state.library = await response.json();
  for (const doc of state.library.docs || []) {
    state.docsById.set(doc.id, doc);
  }
  for (const item of state.library.audio || []) {
    state.audioById.set(item.id, item);
  }
  for (const playlist of state.library.playlists || []) {
    state.playlistById.set(playlist.id, playlist);
  }
}

function initStats() {
  const counts = state.library.counts || {};
  const stats = [
    ['visible docs', counts.visibleDocs || 0],
    ['audio nodes', counts.audio || 0],
    ['playlists', counts.playlists || 0],
    ['gallery shards', counts.gallery || 0],
    ['oracle chunks', counts.corpusChunks || 0],
  ];
  elements.statsRow.innerHTML = stats
    .map(
      ([label, value]) => `
        <div class="stat-card">
          <span class="micro-label">${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `,
    )
    .join('');
}

function initPromptButtons() {
  elements.promptButtons.innerHTML = '';
  for (const prompt of state.library.prompts || []) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'prompt-button';
    button.textContent = prompt;
    button.addEventListener('click', () => {
      elements.chatInput.value = prompt;
      elements.chatInput.focus();
    });
    elements.promptButtons.append(button);
  }
}

function initFilterChips() {
  const kinds = new Set(['all']);
  for (const doc of state.library.docs || []) {
    if (doc.visible) {
      kinds.add(doc.kind);
    }
  }
  elements.filterChipRow.innerHTML = '';
  for (const kind of kinds) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `filter-chip${state.currentFilter === kind ? ' is-active' : ''}`;
    button.textContent = prettyKind(kind);
    button.addEventListener('click', () => {
      state.currentFilter = kind;
      initFilterChips();
      renderLists();
    });
    elements.filterChipRow.append(button);
  }
}

function renderRoster() {
  elements.rosterList.innerHTML = (state.library.roster || [])
    .map(
      (entry) => `<li><strong>${escapeHtml(entry.name)}</strong><br /><span>${escapeHtml(entry.role)}</span></li>`,
    )
    .join('');
}

function matchesDocFilter(doc) {
  if (!doc.visible) return false;
  if (state.currentFilter !== 'all' && doc.kind !== state.currentFilter) return false;
  if (!state.search) return true;
  const haystack = `${doc.title}\n${doc.excerpt}\n${doc.sourcePath}`.toLowerCase();
  return haystack.includes(state.search);
}

function matchesTrackFilter(track) {
  if (state.currentPlaylistId !== 'all') {
    const playlist = state.playlistById.get(state.currentPlaylistId);
    if (!playlist || !playlist.itemIds.includes(track.id)) return false;
  }
  if (!state.search) return true;
  const haystack = `${track.title}\n${track.excerpt}\n${track.collectionTitle}\n${(track.tags || []).join(' ')}`.toLowerCase();
  return haystack.includes(state.search);
}

function renderLists() {
  const chapters = (state.library.docs || []).filter((doc) => doc.kind === 'chapter' && matchesDocFilter(doc));
  const docs = (state.library.docs || []).filter((doc) => doc.kind !== 'chapter' && matchesDocFilter(doc));
  const tracks = (state.library.audio || []).filter(matchesTrackFilter);

  renderListPanel(elements.chapterList, chapters, state.currentDocId, selectDoc, 'doc');
  renderListPanel(elements.docList, docs, state.currentDocId, selectDoc, 'doc');
  renderListPanel(elements.trackList, tracks, state.currentTrackId, selectTrack, 'audio');
}

function renderListPanel(container, items, activeId, onSelect, type) {
  container.innerHTML = '';
  if (!items.length) {
    container.innerHTML = '<div class="ambient-card">No matching entries in the current slice.</div>';
    return;
  }
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `list-button${activeId === item.id ? ' is-active' : ''}`;
    button.dataset.refType = type;
    button.dataset.refId = item.id;
    button.innerHTML = `
      <span class="list-title">${escapeHtml(item.title)}</span>
      <span class="list-subcopy">${escapeHtml(item.collectionTitle || prettyKind(item.kind))} · ${escapeHtml(item.excerpt || item.sourcePath || '')}</span>
    `;
    button.addEventListener('click', () => onSelect(item.id, true));
    container.append(button);
  }
}

function selectDoc(docId, scroll = false) {
  const doc = state.docsById.get(docId);
  if (!doc) return;
  state.currentDocId = docId;
  elements.readerKind.textContent = prettyKind(doc.kind);
  elements.readerTitle.textContent = doc.title;
  elements.readerMeta.innerHTML = `
    <span class="filter-chip is-active">${escapeHtml(prettyKind(doc.kind))}</span>
    <span class="filter-chip">${escapeHtml(summarizePath(doc.sourcePath))}</span>
  `;
  elements.readerContent.innerHTML = doc.html;
  elements.statusActive.textContent = doc.title;
  elements.statusMode.textContent = `reading ${prettyKind(doc.kind)}`;
  renderLists();
  if (scroll) {
    elements.readerContent.scrollTop = 0;
  }
}

function selectTrack(trackId, autoplay = false) {
  const track = state.audioById.get(trackId);
  if (!track) return;
  state.currentTrackId = trackId;
  elements.trackCollection.textContent = track.collectionTitle || track.collection;
  elements.trackTitle.textContent = track.title;
  elements.trackExcerpt.textContent = track.excerpt || 'Signal held in playable form.';
  elements.audioPlayer.src = track.mediaUrl;
  elements.audioPlayer.dataset.trackId = track.id;
  if (track.artUrl) {
    elements.coverArt.src = track.artUrl;
    elements.coverArt.hidden = false;
    elements.coverFallback.classList.add('hidden');
  } else {
    elements.coverArt.hidden = true;
    elements.coverArt.removeAttribute('src');
    elements.coverFallback.classList.remove('hidden');
    elements.coverFallback.textContent = `${track.collectionTitle || 'signal'}\n${track.title}`;
  }
  elements.lyricsPanel.innerHTML = track.lyricsHtml || `<p>${escapeHtml(track.excerpt || 'No packet residue for this track yet.')}</p>`;
  elements.statusActive.textContent = track.title;
  elements.statusMode.textContent = `playing ${track.collectionTitle || 'choir deck'}`;
  renderLists();
  if (autoplay) {
    elements.audioPlayer.play().catch(() => {
      /* autoplay may be blocked */
    });
  }
  if (track.relatedDocIds && track.relatedDocIds.length && !state.currentDocId) {
    selectDoc(track.relatedDocIds[0]);
  }
}

function renderPlaylists() {
  elements.playlistRow.innerHTML = '';
  const all = document.createElement('button');
  all.type = 'button';
  all.className = `playlist-chip${state.currentPlaylistId === 'all' ? ' is-active' : ''}`;
  all.textContent = 'all tracks';
  all.addEventListener('click', () => {
    state.currentPlaylistId = 'all';
    renderPlaylists();
    renderLists();
  });
  elements.playlistRow.append(all);

  for (const playlist of state.library.playlists || []) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `playlist-chip${state.currentPlaylistId === playlist.id ? ' is-active' : ''}`;
    button.textContent = playlist.title;
    button.addEventListener('click', () => {
      state.currentPlaylistId = playlist.id;
      renderPlaylists();
      renderLists();
    });
    elements.playlistRow.append(button);
  }
}

function renderGallery() {
  elements.galleryGrid.innerHTML = '';
  for (const item of state.library.gallery || []) {
    const figure = document.createElement('figure');
    figure.className = 'gallery-card';
    figure.innerHTML = `
      <img src="${encodeURI(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" />
      <figcaption>${escapeHtml(item.title)}</figcaption>
    `;
    figure.addEventListener('click', () => {
      if (state.currentTrackId) {
        const track = state.audioById.get(state.currentTrackId);
        if (track) {
          elements.coverArt.src = item.imageUrl;
          elements.coverArt.hidden = false;
          elements.coverFallback.classList.add('hidden');
          elements.trackExcerpt.textContent = `${track.excerpt} · gallery shard: ${item.title}`;
        }
      }
    });
    elements.galleryGrid.append(figure);
  }
}

function randomAmbientQuote() {
  const pool = [
    ...(state.library.docs || []).filter((doc) => doc.visible).map((doc) => ({
      text: doc.excerpt,
      title: doc.title,
      id: doc.id,
      refType: 'doc',
    })),
    ...(state.library.audio || []).map((track) => ({
      text: track.excerpt,
      title: track.title,
      id: track.id,
      refType: 'audio',
    })),
  ].filter((item) => item.text);
  if (!pool.length) return;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  elements.ambientQuote.textContent = `“${chosen.text}” — ${chosen.title}`;
  elements.artifactJump.textContent = chosen.title;
  elements.artifactJump.classList.add('is-active');
  elements.artifactJump.onclick = () => {
    if (chosen.refType === 'doc') selectDoc(chosen.id, true);
    else selectTrack(chosen.id, true);
  };
}

function scheduleAmbientQuotes() {
  randomAmbientQuote();
  if (state.ambientTimer) window.clearInterval(state.ambientTimer);
  state.ambientTimer = window.setInterval(randomAmbientQuote, 14000);
}

function pushChatBubble(role, content, meta = '') {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  const label = role === 'user' ? 'visitor' : 'thread';
  bubble.innerHTML = `
    <span class="bubble-label">${escapeHtml(label)}${meta ? ` · ${escapeHtml(meta)}` : ''}</span>
    <div>${formatMultiline(content)}</div>
  `;
  elements.chatLog.append(bubble);
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
}

function formatMultiline(text) {
  return escapeHtml(text)
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br />')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function setChatStatus(text) {
  elements.chatStatus.textContent = text;
}

async function submitChat(message) {
  pushChatBubble('user', message);
  state.chatHistory.push({ role: 'user', content: message });
  setChatStatus('seeking thread...');
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: state.chatHistory.slice(-6) }),
    });
    if (!response.ok) {
      throw new Error(`chat failed: ${response.status}`);
    }
    const payload = await response.json();
    const answer = payload.answer || 'The thread returned silence.';
    pushChatBubble('assistant', answer, payload.fallback ? 'fallback splice' : 'live oracle');
    state.chatHistory.push({ role: 'assistant', content: answer });
    state.latestCitations = payload.citations || [];
    renderCitations();
    if (elements.speakToggle.checked) speak(answer);
    if (state.latestCitations.length) {
      const first = state.latestCitations[0];
      elements.artifactJump.textContent = first.title;
      elements.artifactJump.classList.add('is-active');
      elements.artifactJump.onclick = () => openCitation(first);
    }
    setChatStatus(payload.fallback ? 'fallback splice' : 'thread returned');
  } catch (error) {
    pushChatBubble('assistant', `The line broke: ${error.message}`);
    setChatStatus('link unstable');
  }
}

function renderCitations() {
  elements.citationDock.innerHTML = '';
  for (const citation of state.latestCitations) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'citation-chip';
    button.innerHTML = `
      <strong>${escapeHtml(citation.title)}</strong><br />
      <span>${escapeHtml(prettyKind(citation.kind))} · ${escapeHtml(summarizePath(citation.sourcePath))}</span>
    `;
    button.addEventListener('click', () => openCitation(citation));
    elements.citationDock.append(button);
  }
}

function openCitation(citation) {
  if (citation.refType === 'audio' && citation.id) {
    selectTrack(citation.id, true);
    return;
  }
  if (citation.id) {
    selectDoc(citation.id, true);
    return;
  }
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 0.92;
  utterance.volume = 0.84;
  window.speechSynthesis.speak(utterance);
}

function initAudioVisualizer() {
  const width = elements.visualizer.width;
  const height = elements.visualizer.height;

  function drawIdle() {
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#081020');
    gradient.addColorStop(1, '#02050d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(122, 226, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const time = performance.now() * 0.0022;
    for (let index = 0; index < 32; index += 1) {
      const x = 18 + index * 16;
      const bar = 18 + Math.abs(Math.sin(time + index * 0.23)) * (height * 0.42);
      ctx.fillStyle = index % 5 === 0 ? 'rgba(255, 203, 114, 0.84)' : 'rgba(122, 226, 255, 0.72)';
      ctx.fillRect(x, height - bar - 10, 10, bar);
    }
  }

  function ensureAudioGraph() {
    if (state.audioAnalyser || !window.AudioContext) return;
    state.audioContext = new window.AudioContext();
    state.audioAnalyser = state.audioContext.createAnalyser();
    state.audioAnalyser.fftSize = 128;
    state.audioSource = state.audioContext.createMediaElementSource(elements.audioPlayer);
    state.audioSource.connect(state.audioAnalyser);
    state.audioAnalyser.connect(state.audioContext.destination);
  }

  function animate() {
    state.visualizerFrame = requestAnimationFrame(animate);
    if (!state.audioAnalyser || elements.audioPlayer.paused) {
      drawIdle();
      return;
    }
    const bins = new Uint8Array(state.audioAnalyser.frequencyBinCount);
    state.audioAnalyser.getByteFrequencyData(bins);
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#081020');
    gradient.addColorStop(1, '#02050d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    bins.forEach((value, index) => {
      const barHeight = (value / 255) * (height - 30);
      const x = 12 + index * ((width - 24) / bins.length);
      const barWidth = Math.max(6, (width - 24) / bins.length - 4);
      ctx.fillStyle = index % 6 === 0 ? 'rgba(255, 203, 114, 0.88)' : 'rgba(122, 226, 255, 0.82)';
      ctx.fillRect(x, height - barHeight - 12, barWidth, barHeight);
    });
  }

  drawIdle();
  animate();

  elements.audioPlayer.addEventListener('play', async () => {
    ensureAudioGraph();
    if (state.audioContext && state.audioContext.state === 'suspended') {
      await state.audioContext.resume();
    }
  });
}

function initializeOpeningSelection() {
  const openingDocId = state.library.featured?.openingDocId;
  const openingAudioId = state.library.featured?.openingAudioId;
  if (openingDocId && state.docsById.has(openingDocId)) {
    selectDoc(openingDocId);
  }
  if (openingAudioId && state.audioById.has(openingAudioId)) {
    selectTrack(openingAudioId);
  }
}

function bindEvents() {
  elements.bootEnter.addEventListener('click', () => {
    elements.bootOverlay.classList.add('is-hidden');
  });

  elements.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderLists();
  });

  elements.chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = elements.chatInput.value.trim();
    if (!message) return;
    elements.chatInput.value = '';
    await submitChat(message);
  });

  elements.clearChat.addEventListener('click', () => {
    state.chatHistory = [];
    state.latestCitations = [];
    elements.chatLog.innerHTML = '';
    elements.citationDock.innerHTML = '';
    setChatStatus('console cleared');
  });
}

function renderBootstrapMessage() {
  pushChatBubble(
    'assistant',
    'Signal locked. Browse the manuscript, spin the choir deck, or ask the thread what it remembers.',
    'standby shard',
  );
}

async function init() {
  await loadLibrary();
  initStats();
  initPromptButtons();
  initFilterChips();
  renderRoster();
  renderPlaylists();
  renderGallery();
  renderLists();
  initializeOpeningSelection();
  scheduleAmbientQuotes();
  initAudioVisualizer();
  bindEvents();
  renderBootstrapMessage();
}

init().catch((error) => {
  console.error(error);
  elements.readerTitle.textContent = 'archive load failure';
  elements.readerContent.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  elements.statusMode.textContent = 'fault';
  elements.statusActive.textContent = 'load failure';
});
