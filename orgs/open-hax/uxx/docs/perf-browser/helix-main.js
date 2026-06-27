import '../../helix/dist/index.js';
import { attachRunner } from './runner.js';

const React = window.shadow.js.require('module$node_modules$react$index');
const ReactDOM = window.shadow.js.require('module$node_modules$react_dom$index');
const Helix = await import('../../helix/dist/index.js');

attachRunner({
  mode: 'helix',
  React,
  ReactDOM,
  renderTree: (props) => React.createElement(Helix.FileTree, props),
});
