import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ── uxx tokens ── */
const c = {
  bg0: "var(--token-colors-background-default)",
  bg1: "var(--token-colors-background-surface)",
  bg2: "var(--token-colors-background-elevated)",
  bgOverlay: "var(--token-colors-background-overlay)",
  tx: "var(--token-colors-text-default)",
  txMuted: "var(--token-colors-text-muted)",
  txSoft: "var(--token-colors-text-soft)",
  txAccent: "var(--token-colors-text-accent)",
  bd: "var(--token-colors-border-default)",
  bdSub: "var(--token-colors-border-subtle)",
  btn2Bg: "var(--token-colors-button-secondary-bg)",
  btn2Fg: "var(--token-colors-button-secondary-fg)",
  btnGBg: "var(--token-colors-button-ghost-bg)",
  btnGFg: "var(--token-colors-button-ghost-fg)",
  bDefBg: "var(--token-colors-badge-default-bg)",
  bDefFg: "var(--token-colors-badge-default-fg)",
  bOkBg: "var(--token-colors-badge-success-bg)",
  bOkFg: "var(--token-colors-badge-success-fg)",
  bWrBg: "var(--token-colors-badge-warning-bg)",
  bWrFg: "var(--token-colors-badge-warning-fg)",
  bErrBg: "var(--token-colors-badge-error-bg)",
  bErrFg: "var(--token-colors-badge-error-fg)",
  bInfoBg: "var(--token-colors-badge-info-bg)",
  bInfoFg: "var(--token-colors-badge-info-fg)",
} as const;

const prio = (p: string) => {
  if (p === "P0") return { bg: c.bErrBg, fg: c.bErrFg };
  if (p === "P1") return { bg: c.bWrBg, fg: c.bWrFg };
  if (p === "P2") return { bg: c.bInfoBg, fg: c.bInfoFg };
  return { bg: c.bOkBg, fg: c.bOkFg };
};

/* ── types ── */
interface KanbanTask {
  uuid: string;
  title: string;
  status: string;
  priority: string;
  labels: string[];
  content: string;
  sourcePath: string;
}
interface KanbanCol { status: string; title: string; tasks: KanbanTask[]; }
interface KanbanProject { id: string; title: string; tasksDir: string; }
interface Board { totalTasks: number; columns: KanbanCol[]; project?: KanbanProject; }
interface ProjectsPayload { defaultProjectId: string; projects: KanbanProject[]; }

interface Section { type: "body" | "comment"; content: string; }
interface TaskContent {
  frontmatter: Record<string, unknown>;
  sections: Section[];
  sourcePath: string;
  absolutePath: string;
}

/* ── markdown css ── */
const mdCss = `
.md h1,.md h2,.md h3,.md h4,.md h5,.md h6{color:${c.tx};margin:1.2em 0 .5em;font-weight:600}
.md h1{font-size:1.5em}.md h2{font-size:1.3em}.md h3{font-size:1.1em}
.md p{margin:0 0 1em;line-height:1.65;color:${c.tx}}
.md a{color:${c.txAccent};text-decoration:none}.md a:hover{text-decoration:underline}
.md code{background:${c.bg1};padding:2px 5px;border-radius:4px;font-size:.88em}
.md pre{background:${c.bg1};border:1px solid ${c.bd};border-radius:8px;padding:12px;overflow-x:auto;margin:0 0 1em}
.md pre code{background:none;padding:0}
.md blockquote{border-left:3px solid ${c.bd};margin:0 0 1em;padding:4px 14px;color:${c.txSoft}}
.md table{border-collapse:collapse;width:100%;margin:0 0 1em}
.md th,.md td{border:1px solid ${c.bd};padding:7px 10px;text-align:left}
.md th{background:${c.bg1};font-weight:600}
.md ul,.md ol{margin:0 0 1em;padding-left:1.4em}
.md li{margin-bottom:.25em}
.md hr{border:none;border-top:1px solid ${c.bd};margin:1.2em 0}
.md img{max-width:100%;border-radius:8px}
`;

/* ── helpers ── */
const FRONTMATTER_KEYS = ["uuid", "title", "status", "priority", "labels", "created_at", "source", "points", "category"];
const STATUS_OPTIONS = ["incoming", "todo", "in_progress", "blocked", "review", "document", "done", "rejected"];
const PRIO_OPTIONS = ["P0", "P1", "P2", "P3"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 6,
  border: `1px solid ${c.bd}`,
  background: c.bg1,
  color: c.tx,
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: c.txMuted,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 3,
};

/* ── app ── */
export function App() {
  const [projects, setProjects] = useState<KanbanProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<KanbanTask | null>(null);
  const [detail, setDetail] = useState<TaskContent | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dragUuid, setDragUuid] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const sidebarRef = useRef<HTMLDivElement>(null);

  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); }, []);
  const projectParam = projectId ? `?project=${encodeURIComponent(projectId)}` : "";

  const loadProjects = useCallback(async () => {
    const r = await fetch("/api/projects", { cache: "no-store" });
    if (!r.ok) throw new Error(`${r.status}`);
    const payload = (await r.json()) as ProjectsPayload;
    setProjects(payload.projects);
    setProjectId((current) => current || payload.defaultProjectId || payload.projects[0]?.id || "");
  }, []);

  const loadBoard = useCallback(async () => {
    if (!projectId) return;
    const r = await fetch(`/api/board${projectParam}`, { cache: "no-store" });
    if (!r.ok) throw new Error(`${r.status}`);
    setBoard(await r.json());
  }, [projectId, projectParam]);

  useEffect(() => { loadProjects().catch((e) => flash(String(e))); }, [loadProjects, flash]);
  useEffect(() => { loadBoard().catch((e) => flash(String(e))); }, [loadBoard, flash]);
  useEffect(() => {
    setBoard(null);
    setSelected(null);
    setDetail(null);
    setCommentDraft("");
    setEditingField(null);
  }, [projectId]);

  const loadDetail = useCallback(async (task: KanbanTask) => {
    setLoadingDetail(true);
    try {
      const r = await fetch(`/api/task/${encodeURIComponent(task.uuid)}/content${projectParam}`);
      if (r.ok) setDetail(await r.json());
    } catch { /* ignore */ }
    finally { setLoadingDetail(false); }
  }, [projectParam]);

  const move = useCallback(async (uuid: string, status: string) => {
    const r = await fetch(`/api/task/${encodeURIComponent(uuid)}/status${projectParam}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!r.ok) return flash(await r.text());
    await loadBoard();
    // Refresh detail if viewing same task
    if (selected?.uuid === uuid) {
      const t = (await (await fetch(`/api/board${projectParam}`)).json()).columns.flatMap((c: KanbanCol) => c.tasks).find((t: KanbanTask) => t.uuid === uuid);
      if (t) { setSelected(t); loadDetail(t); }
    }
  }, [loadBoard, flash, selected, loadDetail, projectParam]);

  const openDetail = useCallback((task: KanbanTask) => { setSelected(task); loadDetail(task); }, [loadDetail]);

  const closeDetail = useCallback(() => { setSelected(null); setDetail(null); setCommentDraft(""); setEditingField(null); }, []);

  const openEditor = useCallback(async (task: KanbanTask) => {
    const r = await fetch(`/api/task/${encodeURIComponent(task.uuid)}/open-editor${projectParam}`, { method: "POST" });
    flash(r.ok ? `Opened ${task.sourcePath}` : await r.text());
  }, [flash, projectParam]);

  const saveField = useCallback(async (key: string, value: unknown) => {
    if (!selected) return;
    const r = await fetch(`/api/task/${encodeURIComponent(selected.uuid)}/frontmatter${projectParam}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (r.ok) {
      setDetail(await r.json());
      await loadBoard();
      flash(`Updated ${key}`);
    } else {
      flash(await r.text());
    }
    setEditingField(null);
  }, [selected, loadBoard, flash, projectParam]);

  const addComment = useCallback(async () => {
    if (!selected || !commentDraft.trim()) return;
    const r = await fetch(`/api/task/${encodeURIComponent(selected.uuid)}/comment${projectParam}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: commentDraft.trim() }),
    });
    if (r.ok) {
      setDetail(await r.json());
      setCommentDraft("");
      flash("Comment added");
    } else {
      flash(await r.text());
    }
  }, [selected, commentDraft, flash, projectParam]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeDetail(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [closeDetail]);

  if (!board) return <div style={{ display: "grid", placeItems: "center", height: "100vh", color: c.tx }}>Loading…</div>;

  const currentProject = board.project ?? projects.find((project) => project.id === projectId);

  const filtered = board.columns
    .map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => {
        if (!query) return true;
        return [t.title, t.priority, t.labels.join(" "), t.sourcePath].join(" ").toLowerCase().includes(query.toLowerCase());
      }),
    }))
    .filter((col) => col.tasks.length > 0 || !query);

  const renderFieldValue = (key: string, value: unknown) => {
    if (key === "labels" && Array.isArray(value)) {
      return (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {value.map((l, i) => <span key={i} style={{ fontSize: 11, padding: "1px 6px", borderRadius: 999, border: `1px solid ${c.bdSub}` }}>{l}</span>)}
        </div>
      );
    }
    if (key === "priority") {
      const pr = prio(String(value));
      return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: pr.bg, color: pr.fg }}>{String(value)}</span>;
    }
    if (key === "status") {
      return <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, background: c.bInfoBg, color: c.bInfoFg }}>{String(value)}</span>;
    }
    return <span style={{ fontSize: 13, color: c.tx }}>{String(value ?? "—")}</span>;
  };

  const renderFieldEditor = (key: string, value: unknown) => {
    if (key === "status") {
      return (
        <select style={selectStyle} defaultValue={String(value)} autoFocus onBlur={(e) => saveField(key, e.target.value)} onChange={(e) => saveField(key, e.target.value)}>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      );
    }
    if (key === "priority") {
      return (
        <select style={selectStyle} defaultValue={String(value)} autoFocus onBlur={(e) => saveField(key, e.target.value)} onChange={(e) => saveField(key, e.target.value)}>
          {PRIO_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      );
    }
    if (key === "labels") {
      const arr = Array.isArray(value) ? value.join(", ") : String(value ?? "");
      return (
        <input style={inputStyle} defaultValue={arr} autoFocus
          onBlur={(e) => saveField(key, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          onKeyDown={(e) => { if (e.key === "Enter") saveField(key, (e.target as HTMLInputElement).value.split(",").map((s) => s.trim()).filter(Boolean)); }}
        />
      );
    }
    if (key === "points") {
      return (
        <input type="number" style={inputStyle} defaultValue={value != null ? String(value) : ""} autoFocus
          onBlur={(e) => saveField(key, e.target.value ? Number(e.target.value) : null)}
          onKeyDown={(e) => { if (e.key === "Enter") saveField(key, (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : null); }}
        />
      );
    }
    return (
      <input style={inputStyle} defaultValue={String(value ?? "")} autoFocus
        onBlur={(e) => saveField(key, e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") saveField(key, (e.target as HTMLInputElement).value); }}
      />
    );
  };

  return (
    <>
      <style>{mdCss}</style>
      <div style={{
        display: "flex", height: "100vh",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        background: `radial-gradient(1200px 800px at 20% 0%, rgba(130,170,255,.12), transparent 60%), ${c.bg0}`,
        color: c.tx,
      }}>
        {/* ── board area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* header */}
          <header style={{
            display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", borderBottom: `1px solid ${c.bd}`,
            background: `${c.bg0}d9`, backdropFilter: "blur(10px)",
          }}>
            <h1 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Kanban — {currentProject?.title ?? projectId} — {board.totalTasks} tasks</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                style={{ width: "min(260px,28vw)", padding: "7px 10px", borderRadius: 8, border: `1px solid ${c.bd}`, background: c.bg1, color: c.tx, outline: "none", fontSize: 13 }}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
              </select>
              <input type="search" placeholder="filter…" value={query} onChange={(e) => setQuery(e.target.value)}
                style={{ width: "min(320px,40vw)", padding: "7px 10px", borderRadius: 8, border: `1px solid ${c.bd}`, background: c.bg1, color: c.tx, outline: "none", fontSize: 13 }} />
              <button onClick={() => loadBoard().catch((e) => flash(String(e)))}
                style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${c.bd}`, background: c.bg1, color: c.tx, cursor: "pointer", fontSize: 13 }}>reload</button>
            </div>
          </header>

          {/* columns */}
          <div style={{ flex: 1, padding: 10, overflow: "hidden" }}>
            <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(240px,1fr)", gap: 8, height: "100%", overflowX: "auto", overflowY: "hidden" }}>
              {filtered.map((col) => (
                <section key={col.status} style={{
                  background: `linear-gradient(180deg, ${c.bg1}f2, ${c.bg1}c7)`,
                  border: `1px solid ${c.bd}`, borderRadius: 12,
                  display: "flex", flexDirection: "column", minHeight: 0,
                }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(col.status); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(null); const u = e.dataTransfer.getData("text/plain"); if (u) move(u, col.status); }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderBottom: `1px solid ${c.bd}` }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{col.title}</span>
                    <span style={{ color: c.txMuted, fontSize: 11 }}>{col.tasks.length}</span>
                  </div>
                  <div style={{
                    flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 6,
                    overflowY: "auto", minHeight: 0,
                    outline: dragOver === col.status ? `2px dashed rgba(130,170,255,.4)` : undefined,
                    outlineOffset: -4, borderRadius: 6,
                  }}>
                    {col.tasks.map((task) => {
                      const pr = prio(task.priority);
                      const isActive = selected?.uuid === task.uuid;
                      return (
                        <div key={task.uuid} draggable
                          onDragStart={(e) => { e.dataTransfer.setData("text/plain", task.uuid); setDragUuid(task.uuid); }}
                          onDragEnd={() => setDragUuid(null)}
                          onClick={() => openDetail(task)}
                          style={{
                            background: isActive ? `${c.txAccent}18` : `linear-gradient(180deg, ${c.bg2}f2, ${c.bg2}c7)`,
                            border: `1px solid ${isActive ? c.txAccent : c.bdSub}`,
                            borderRadius: 8, padding: 8, cursor: "grab",
                            opacity: dragUuid === task.uuid ? 0.4 : 1,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "start" }}>
                            <span style={{ fontSize: 12, lineHeight: 1.25, fontWeight: 600 }}>{task.title}</span>
                            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: pr.bg, color: pr.fg, whiteSpace: "nowrap", flexShrink: 0 }}>{task.priority}</span>
                          </div>
                          <div style={{ marginTop: 6, display: "flex", gap: 3, flexWrap: "wrap", color: c.txMuted, fontSize: 10 }}>
                            {task.labels.slice(0, 3).map((l) => <span key={l} style={{ padding: "0px 5px", borderRadius: 999, border: `1px solid ${c.bdSub}` }}>{l}</span>)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        {/* ── sidebar ── */}
        {selected && (
          <aside ref={sidebarRef} style={{
            width: "min(520px, 45vw)", flexShrink: 0,
            borderLeft: `1px solid ${c.bd}`,
            background: c.bg0,
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* sidebar header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", borderBottom: `1px solid ${c.bd}`,
              background: `${c.bg1}80`, flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.title}</span>
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: prio(selected.priority).bg, color: prio(selected.priority).fg, flexShrink: 0 }}>{selected.priority}</span>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => openEditor(selected)} title="Open in editor"
                  style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${c.bd}`, background: c.btn2Bg, color: c.btn2Fg, cursor: "pointer", fontSize: 12 }}>✎</button>
                <button onClick={closeDetail} title="Close"
                  style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${c.bd}`, background: c.btnGBg, color: c.btnGFg, cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>
            </div>

            {/* sidebar body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 0 16px" }}>
              {loadingDetail ? (
                <div style={{ padding: 16, color: c.txMuted }}>Loading…</div>
              ) : detail ? (
                <>
                  {/* ── frontmatter fields ── */}
                  <div style={{ padding: "12px 16px", borderBottom: `1px solid ${c.bd}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.txMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Frontmatter</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {FRONTMATTER_KEYS.filter((k) => detail.frontmatter[k] !== undefined).map((key) => (
                        <div key={key} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
                          onDoubleClick={() => { setEditingField(key); setEditValue(String(detail.frontmatter[key] ?? "")); }}
                        >
                          <div style={{ width: 80, flexShrink: 0 }}>
                            <div style={labelStyle}>{key}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {editingField === key
                              ? renderFieldEditor(key, detail.frontmatter[key])
                              : renderFieldValue(key, detail.frontmatter[key])}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: c.txMuted }}>Double-click a field to edit</div>
                  </div>

                  {/* ── body sections ── */}
                  {detail.sections.filter((s) => s.type === "body").map((section, i) => (
                    <div key={`body-${i}`} className="md" style={{ padding: "12px 16px", borderBottom: `1px solid ${c.bd}` }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
                    </div>
                  ))}

                  {/* ── comment sections ── */}
                  {detail.sections.filter((s) => s.type === "comment").length > 0 && (
                    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${c.bd}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: c.txMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Comments</div>
                      {detail.sections.filter((s) => s.type === "comment").map((section, i) => (
                        <div key={`comment-${i}`} style={{
                          background: `${c.bg1}`,
                          border: `1px solid ${c.bdSub}`,
                          borderLeft: `3px solid ${c.txAccent}66`,
                          borderRadius: 6,
                          padding: "8px 12px",
                          marginBottom: 8,
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: c.txSoft,
                          whiteSpace: "pre-wrap",
                        }}>
                          {section.content}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── add comment ── */}
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.txMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Add comment</div>
                    <textarea value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} placeholder="Write a comment…" rows={3}
                      style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} />
                    <button onClick={addComment} disabled={!commentDraft.trim()}
                      style={{
                        marginTop: 6, padding: "6px 12px", borderRadius: 6,
                        border: `1px solid ${c.bd}`, background: commentDraft.trim() ? c.btn2Bg : c.bg1,
                        color: commentDraft.trim() ? c.btn2Fg : c.txMuted,
                        cursor: commentDraft.trim() ? "pointer" : "default", fontSize: 12,
                      }}>Add comment</button>
                  </div>

                  {/* ── source info ── */}
                  <div style={{ padding: "8px 16px", fontSize: 11, color: c.txMuted, borderTop: `1px solid ${c.bd}` }}>
                    {detail.sourcePath}
                  </div>
                </>
              ) : (
                <div style={{ padding: 16, color: c.txMuted }}>No content</div>
              )}
            </div>
          </aside>
        )}

        {/* toast */}
        {toast && (
          <div style={{
            position: "fixed", bottom: 12, right: 12,
            maxWidth: "min(480px,80vw)", padding: "8px 12px",
            borderRadius: 8, border: `1px solid ${c.bd}`,
            background: `${c.bg1}ea`, color: c.tx, whiteSpace: "pre-wrap", zIndex: 9999, fontSize: 12,
          }}>{toast}</div>
        )}
      </div>
    </>
  );
}
