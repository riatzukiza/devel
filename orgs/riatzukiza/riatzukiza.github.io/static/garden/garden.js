async function loadManifest() {
  const res = await fetch("./manifest.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`manifest load failed: ${res.status}`);
  return res.json();
}

function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

function setQuery(params) {
  const next = new URL(location.href);
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === "") {
      next.searchParams.delete(k);
    } else {
      next.searchParams.set(k, v);
    }
  }
  history.replaceState(null, "", next.toString());
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, String(v));
  }
  for (const child of children) {
    if (child == null) continue;
    node.append(child);
  }
  return node;
}

function projectDefaultGraph(project) {
  return project.graphs.find((g) => g.id === "subsystems")?.id ?? project.graphs[0]?.id;
}

function buildIndexPage(manifest) {
  const grid = document.getElementById("garden-grid");
  if (!grid) return;

  grid.innerHTML = "";
  for (const project of manifest.projects ?? []) {
    const subsystems = project.graphs.find((g) => g.kind === "subsystems") ?? project.graphs[0];
    const graphId = projectDefaultGraph(project);

    const card = el("div", { class: "card" }, [
      el("div", { class: "preview" }, [
        el("img", {
          src: subsystems?.png ?? subsystems?.svg ?? "",
          alt: `${project.title} preview`,
          loading: "lazy",
        }),
      ]),
      el("div", { class: "body" }, [
        el("div", { class: "title", text: project.title ?? project.id }),
        el("div", { class: "desc", text: project.description ?? "" }),
        el("div", { class: "tags" }, (project.tags ?? []).map((t) => el("span", { class: "tag", text: t }))),
        el("div", { class: "actions" }, [
          el(
            "a",
            {
              class: "btn primary",
              href: `./viewer.html?project=${encodeURIComponent(project.id)}&graph=${encodeURIComponent(graphId)}`,
            },
            [document.createTextNode("Enter garden")],
          ),
          subsystems?.svg
            ? el(
                "a",
                { class: "btn", href: `./viewer.html?project=${encodeURIComponent(project.id)}&graph=${encodeURIComponent(subsystems.id)}` },
                [document.createTextNode("Subsystems")],
              )
            : null,
        ]),
      ]),
    ]);

    grid.append(card);
  }
}

function getNodeLabel(nodeG) {
  const title = nodeG.querySelector("title")?.textContent ?? "";
  if (title.trim()) return title.trim();
  const text = nodeG.querySelector("text")?.textContent ?? "";
  return text.trim();
}

function applySearchHighlight(svgRoot, query) {
  const q = query.trim().toLowerCase();
  const nodes = Array.from(svgRoot.querySelectorAll("g.node"));
  if (q.length === 0) {
    for (const n of nodes) {
      n.classList.remove("highlight");
      n.classList.remove("dim");
    }
    return;
  }

  for (const n of nodes) {
    const label = getNodeLabel(n).toLowerCase();
    const match = label.includes(q);
    n.classList.toggle("highlight", match);
    n.classList.toggle("dim", !match);
  }
}

function buildViewerPage(manifest) {
  const projectSelect = document.getElementById("projectSelect");
  const graphList = document.getElementById("graphList");
  const stageTitle = document.getElementById("stageTitle");
  const stageMeta = document.getElementById("stageMeta");
  const openRaw = document.getElementById("openRaw");
  const searchInput = document.getElementById("search");
  const canvas = document.getElementById("svgCanvas");

  if (!projectSelect || !graphList || !stageTitle || !stageMeta || !openRaw || !searchInput || !canvas) {
    return;
  }

  const projects = manifest.projects ?? [];
  const projectFromQuery = qs("project");
  const graphFromQuery = qs("graph");

  const currentProject =
    projects.find((p) => p.id === projectFromQuery) ??
    projects[0];

  if (!currentProject) {
    stageTitle.textContent = "No projects in manifest";
    return;
  }

  // Populate project dropdown
  projectSelect.innerHTML = "";
  for (const p of projects) {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.title ?? p.id;
    projectSelect.append(opt);
  }
  projectSelect.value = currentProject.id;

  function getGraphById(project, id) {
    return (project.graphs ?? []).find((g) => g.id === id) ?? (project.graphs ?? [])[0];
  }

  let currentGraph = getGraphById(currentProject, graphFromQuery ?? projectDefaultGraph(currentProject));
  if (!currentGraph) currentGraph = (currentProject.graphs ?? [])[0];

  let panZoom = null;
  let resizeBound = false;

  async function loadGraph(project, graph) {
    if (!graph) return;
    setQuery({ project: project.id, graph: graph.id });

    // Sidebar active state
    for (const a of graphList.querySelectorAll("a[data-graph-id]") ?? []) {
      a.classList.toggle("active", a.getAttribute("data-graph-id") === graph.id);
    }

    stageTitle.textContent = `${project.title ?? project.id} · ${graph.title ?? graph.id}`;
    stageMeta.textContent = graph.kind ? `kind: ${graph.kind}` : "";
    openRaw.href = graph.svg;

    const res = await fetch(graph.svg, { cache: "no-cache" });
    if (!res.ok) {
      canvas.innerHTML = `<div style=\"padding:12px;color:#cfd6e6\">failed to load svg: ${res.status}</div>`;
      return;
    }

    const svgText = await res.text();
    canvas.innerHTML = svgText;

    const svg = canvas.querySelector("svg");
    if (!svg) return;

    // Make sure it scales inside our container.
    svg.removeAttribute("width");
    svg.removeAttribute("height");

    // Destroy previous pan/zoom
    try {
      panZoom?.destroy?.();
    } catch {
      // ignore
    }
    panZoom = null;

    if (window.svgPanZoom) {
      panZoom = window.svgPanZoom(svg, {
        controlIconsEnabled: true,
        zoomEnabled: true,
        panEnabled: true,
        fit: true,
        center: true,
        minZoom: 0.1,
        maxZoom: 40,
      });

      // Best-effort resize handling.
      if (!resizeBound) {
        resizeBound = true;
        window.addEventListener(
          "resize",
          () => {
            try {
              panZoom?.resize?.();
              panZoom?.fit?.();
              panZoom?.center?.();
            } catch {
              // ignore
            }
          },
          { passive: true },
        );
      }
    }

    // Apply current search highlight
    applySearchHighlight(svg, searchInput.value ?? "");
  }

  function renderGraphList(project) {
    graphList.innerHTML = "";
    const groups = {
      subsystems: [],
      entry: [],
      files: [],
      other: [],
    };

    for (const g of project.graphs ?? []) {
      if (g.kind === "subsystems") groups.subsystems.push(g);
      else if (g.kind === "entry") groups.entry.push(g);
      else if (g.kind === "files") groups.files.push(g);
      else groups.other.push(g);
    }

    const order = ["subsystems", "entry", "files", "other"];

    for (const key of order) {
      const list = groups[key];
      if (!list || list.length === 0) continue;

      graphList.append(el("div", { style: "margin:10px 0 6px;color:#8a92a6;font-size:11px;" , text: key }));

      for (const g of list) {
        const a = el(
          "a",
          {
            href: `./viewer.html?project=${encodeURIComponent(project.id)}&graph=${encodeURIComponent(g.id)}`,
            "data-graph-id": g.id,
            class: g.id === currentGraph?.id ? "active" : "",
            onclick: (ev) => {
              ev.preventDefault();
              currentGraph = g;
              loadGraph(project, g);
              for (const a2 of graphList.querySelectorAll("a[data-graph-id]") ?? []) {
                a2.classList.toggle("active", a2.getAttribute("data-graph-id") === g.id);
              }
            },
          },
          [document.createTextNode(g.title ?? g.id)],
        );
        graphList.append(a);
      }
    }
  }

  projectSelect.addEventListener("change", () => {
    const nextProject = projects.find((p) => p.id === projectSelect.value) ?? currentProject;
    currentGraph = getGraphById(nextProject, projectDefaultGraph(nextProject));
    renderGraphList(nextProject);
    loadGraph(nextProject, currentGraph);
  });

  searchInput.addEventListener("input", () => {
    const svg = canvas.querySelector("svg");
    if (!svg) return;
    applySearchHighlight(svg, searchInput.value ?? "");
  });

  // initial render
  renderGraphList(currentProject);
  loadGraph(currentProject, currentGraph);
}

(async function boot() {
  try {
    const manifest = await loadManifest();
    buildIndexPage(manifest);
    buildViewerPage(manifest);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const slot = document.getElementById("garden-error");
    if (slot) {
      slot.textContent = msg;
      return;
    }
    console.error("garden boot failed", error);
  }
})();
