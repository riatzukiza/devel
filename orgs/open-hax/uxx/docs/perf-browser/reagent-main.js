import '../../reagent/dist/index.js';
import { attachRunner } from './runner.js';

const React = window.shadow.js.require('module$node_modules$react$index');
const ReactDOM = window.shadow.js.require('module$node_modules$react_dom$index');
const Reagent = await import('../../reagent/dist/index.js');
const cljs = window.cljs.core;

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

attachRunner({
  mode: 'reagent',
  React,
  ReactDOM,
  renderTree: (props) => Reagent.FileTree(toTopLevelCljsMap(props)),
});
