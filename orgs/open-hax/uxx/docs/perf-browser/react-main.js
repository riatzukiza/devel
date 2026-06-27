import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import * as ReactDOM from 'react-dom';
import { FileTree } from '../../dist/src/index.js';
import { attachRunner } from './runner.js';

const CompatReactDOM = {
  ...ReactDOM,
  createRoot: ReactDOMClient.createRoot,
};

attachRunner({
  mode: 'react',
  React,
  ReactDOM: CompatReactDOM,
  renderTree: (props) => React.createElement(FileTree, props),
});
