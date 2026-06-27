# @workspace/webgl-graph-view

A tiny, dependency-free WebGL graph renderer extracted from the *idea* of the Fork Tales “Web Graph Weaver” view:

- stable 2D world coordinates + pan/zoom camera
- GPU-backed drawing (LINES + POINTS)
- adaptive quality (throttle + DPR cap when dense)
- simple picking + selection highlighting


> Built with [GLM-5](https://z.ai) — part of the [z.ai](https://z.ai) startup ecosystem and the [Ussyverse](https://ussy.cloud).

## Usage

```ts
import { WebGLGraphView } from "@workspace/webgl-graph-view";

const canvas = document.querySelector("canvas")!;

const view = new WebGLGraphView(canvas, {
  onNodeClick: (node) => console.log("clicked", node.id),
});

view.setGraph({
  nodes: [
    { id: "a", x: -80, y: 0, kind: "domain" },
    { id: "b", x: 80, y: 0, kind: "url" },
  ],
  edges: [{ source: "a", target: "b", kind: "hyperlink" }],
});

view.fitToGraph();
```

## Notes

- Node/edge styling is provided via `nodeStyle` / `edgeStyle` options.
- Positions are in **world space**; `fitToGraph()` computes a camera transform.
- Call `destroy()` when you’re done.
