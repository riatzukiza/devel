import { JSDOM } from 'jsdom';

const mode = process.argv[2] ?? 'root';
const updates = Number(process.argv[3] ?? '40');

function makeTree(depth, breadth, filesPerFolder, prefix = 'root') {
  const items = [];

  for (let i = 0; i < breadth; i += 1) {
    const folderId = `${prefix}/folder-${depth}-${i}`;
    const children = [];

    for (let j = 0; j < filesPerFolder; j += 1) {
      children.push({
        id: `${folderId}/file-${j}.ts`,
        name: `file-${j}.ts`,
        type: 'file',
        size: 512 + j * 17,
        badge: j % 3 === 0 ? 'M' : undefined,
      });
    }

    if (depth > 1) {
      children.push(...makeTree(depth - 1, breadth, filesPerFolder, folderId));
    }

    items.push({
      id: folderId,
      name: `folder-${depth}-${i}`,
      type: 'folder',
      badge: `${children.length}`,
      children,
    });
  }

  return items;
}

function collectFolderIds(items, acc = []) {
  for (const item of items) {
    if (item.type === 'folder') {
      acc.push(item.id);
      if (item.children) collectFolderIds(item.children, acc);
    }
  }
  return acc;
}

function collectFileIds(items, acc = []) {
  for (const item of items) {
    if (item.type === 'file') {
      acc.push(item.id);
    } else if (item.children) {
      collectFileIds(item.children, acc);
    }
  }
  return acc;
}

function cloneTree(items) {
  return items.map((item) => ({
    ...item,
    children: item.children ? cloneTree(item.children) : undefined,
  }));
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const originalConsoleError = console.error;
console.error = (...args) => {
  const first = String(args[0] ?? '');
  if (first.includes('ReactDOM.render is no longer supported in React 18')) return;
  if (first.includes('unmountComponentAtNode is deprecated')) return;
  originalConsoleError(...args);
};

async function loadMode(selectedMode) {
  if (selectedMode === 'root') {
    const React = await import('react');
    const ReactDOM = await import('react-dom');
    const mod = await import('../dist/src/index.js');

    return {
      name: 'react',
      React,
      ReactDOM,
      Profiler: React.Profiler,
      act: React.act,
      renderComponent: (props) => React.createElement(mod.FileTree, props),
    };
  }

  if (selectedMode === 'helix') {
    const mod = await import('../helix/dist/index.js');
    const React = globalThis.shadow.js.require('module$node_modules$react$index');
    const ReactDOM = globalThis.shadow.js.require('module$node_modules$react_dom$index');

    return {
      name: 'helix',
      React,
      ReactDOM,
      Profiler: React.Profiler,
      act: React.act,
      renderComponent: (props) => React.createElement(mod.FileTree, props),
    };
  }

  if (selectedMode === 'reagent') {
    const mod = await import('../reagent/dist/index.js');
    const React = globalThis.shadow.js.require('module$node_modules$react$index');
    const ReactDOM = globalThis.shadow.js.require('module$node_modules$react_dom$index');
    const cljs = globalThis.cljs?.core;
    if (!cljs?.PersistentArrayMap?.fromArray) {
      throw new Error('Reagent cljs runtime not loaded');
    }

    function toTopLevelCljsMap(props) {
      return cljs.PersistentArrayMap.fromArray([
        'items', props.items,
        'expandedIds', props.expandedIds,
        'selectedId', props.selectedId,
        'showIcons', props.showIcons,
        'showSize', props.showSize,
        'indentSize', props.indentSize,
      ], true);
    }

    function ReagentFileTreeAdapter({ props }) {
      return mod.FileTree(toTopLevelCljsMap(props));
    }

    return {
      name: 'reagent',
      React,
      ReactDOM,
      Profiler: React.Profiler,
      act: React.act,
      renderComponent: (props) => React.createElement(ReagentFileTreeAdapter, { props }),
    };
  }

  throw new Error(`Unknown mode: ${selectedMode}`);
}

const harness = await loadMode(mode);
const items = makeTree(3, 5, 6);
const expandedIds = collectFolderIds(items);
const fileIds = collectFileIds(items);

const container = document.getElementById('root');
const commits = [];

function onRender(id, phase, actualDuration, baseDuration) {
  commits.push({ id, phase, actualDuration, baseDuration });
}

function makeProps(step, freshItems) {
  return {
    items: freshItems ? cloneTree(items) : items,
    expandedIds,
    selectedId: fileIds[step % fileIds.length],
    showIcons: true,
    showSize: true,
    indentSize: 14,
  };
}

async function renderOnce(props, label) {
  await harness.act(async () => {
    harness.ReactDOM.render(
      harness.React.createElement(
        harness.Profiler,
        { id: `${harness.name}-${label}`, onRender },
        harness.renderComponent(props),
      ),
      container,
    );
  });
}

async function runScenario(label, freshItems) {
  commits.length = 0;

  const start = process.hrtime.bigint();
  for (let i = 0; i < updates; i += 1) {
    await renderOnce(makeProps(i, freshItems), label);
  }
  const end = process.hrtime.bigint();

  const totalActualDuration = commits.reduce((sum, commit) => sum + commit.actualDuration, 0);
  const totalBaseDuration = commits.reduce((sum, commit) => sum + commit.baseDuration, 0);
  const durationMs = Number(end - start) / 1e6;

  return {
    label,
    updates,
    commits: commits.length,
    wallMs: durationMs,
    wallMsPerUpdate: durationMs / updates,
    totalActualDuration,
    avgActualDuration: totalActualDuration / Math.max(1, commits.length),
    totalBaseDuration,
    avgBaseDuration: totalBaseDuration / Math.max(1, commits.length),
    domNodes: container.querySelectorAll('*').length,
  };
}

const stable = await runScenario('stable-items', false);
const fresh = await runScenario('fresh-items', true);

await harness.act(async () => {
  harness.ReactDOM.unmountComponentAtNode(container);
});

dom.window.close();

console.log(JSON.stringify({
  mode: harness.name,
  component: 'FileTree',
  updates,
  scenarios: { stable, fresh },
}, null, 2));

process.exit(0);
