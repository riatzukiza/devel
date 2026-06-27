import { makeTree, collectFolderIds, collectFileIds, cloneTree, summarizeCommits, prettyJson } from './shared.js';

export function attachRunner({ mode, React, ReactDOM, renderTree }) {
  const h = React.createElement;
  const baseItems = makeTree(3, 5, 6);
  const expandedIds = collectFolderIds(baseItems);
  const fileIds = collectFileIds(baseItems);
  const mountNode = document.getElementById('mount');

  function App() {
    const [iterations, setIterations] = React.useState(20);
    const [treeProps, setTreeProps] = React.useState(() => makeProps(0, false));
    const [results, setResults] = React.useState({
      mode,
      note: 'Open browser DevTools Profiler, then click a scenario button.',
    });
    const commitsRef = React.useRef([]);

    const onRender = React.useCallback((id, phase, actualDuration, baseDuration) => {
      commitsRef.current.push({ id, phase, actualDuration, baseDuration });
    }, []);

    const runScenario = React.useCallback((label, freshItems) => {
      commitsRef.current = [];
      const start = performance.now();

      for (let i = 0; i < iterations; i += 1) {
        const nextProps = makeProps(i, freshItems);
        if (typeof ReactDOM.flushSync === 'function') {
          ReactDOM.flushSync(() => {
            setTreeProps(nextProps);
          });
        } else {
          setTreeProps(nextProps);
        }
      }

      const end = performance.now();
      const scenario = summarizeCommits(commitsRef.current, label, end - start, iterations);
      setResults({
        mode,
        scenario,
      });
    }, [iterations]);

    return h('main', null,
      h('div', { className: 'card' },
        h('span', { className: 'badge' }, `mode: ${mode}`),
        h('span', { className: 'badge' }, 'component: FileTree'),
        h('span', { className: 'badge' }, 'browser-style profiler harness'),
      ),
      h('div', { className: 'grid' },
        h('section', { className: 'controls' },
          h('div', { className: 'card' },
            h('h2', null, 'Controls'),
            h('label', null,
              'Iterations',
              h('input', {
                type: 'number',
                min: 1,
                max: 200,
                value: iterations,
                onChange: (event) => setIterations(Number(event.target.value) || 1),
              }),
            ),
            h('div', { className: 'button-row' },
              h('button', { className: 'primary', onClick: () => runScenario('stable-items', false) }, 'Run stable-items'),
              h('button', { className: 'success', onClick: () => runScenario('fresh-items', true) }, 'Run fresh-items'),
              h('button', { onClick: () => setTreeProps(makeProps(0, false)) }, 'Reset tree'),
            ),
          ),
          h('div', { className: 'card' },
            h('h2', null, 'Latest result'),
            h('div', { className: 'results' }, prettyJson(results)),
          ),
          h('div', { className: 'card' },
            h('h3', null, 'How to use'),
            h('ol', null,
              h('li', null, 'Open browser DevTools Profiler.'),
              h('li', null, 'Start recording.'),
              h('li', null, 'Run stable-items or fresh-items.'),
              h('li', null, 'Stop recording and inspect commit timing.'),
            ),
          ),
        ),
        h('section', { className: 'mount card' },
          h(React.Profiler, { id: `${mode}-file-tree`, onRender }, renderTree(treeProps)),
        ),
      ),
    );
  }

  function makeProps(step, freshItems) {
    return {
      items: freshItems ? cloneTree(baseItems) : baseItems,
      expandedIds,
      selectedId: fileIds[step % fileIds.length],
      showIcons: true,
      showSize: true,
      indentSize: 14,
    };
  }

  if (typeof ReactDOM.createRoot === 'function') {
    const root = ReactDOM.createRoot(mountNode);
    root.render(h(App));
  } else {
    ReactDOM.render(h(App), mountNode);
  }
}
