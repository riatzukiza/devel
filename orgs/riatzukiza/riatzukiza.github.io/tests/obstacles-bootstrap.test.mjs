import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import {
  LEGACY_OBSTACLES_PATH,
  createLegacyObstaclesFrame,
  mountLegacyObstaclesFrame,
} from "../static/client/obstacles/legacy-frame.mjs";

const require = createRequire(import.meta.url);
const QuadTree = require("@timohausmann/quadtree-js");

const readWorkspaceFile = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

const countStoredRects = (node) => node.objects.length + node.nodes.reduce((sum, child) => sum + countStoredRects(child), 0);

const createFakeDocument = () => {
  const htmlStyle = {};
  const bodyStyle = {};
  const body = {
    style: bodyStyle,
    children: [],
    replaceChildren(...children) {
      this.children = children;
    },
  };

  return {
    documentElement: { style: htmlStyle },
    body,
    createElement(tagName) {
      return {
        tagName,
        style: {},
        attributes: {},
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
      };
    },
  };
};

test("createLegacyObstaclesFrame builds a full-page iframe", () => {
  const fakeDocument = createFakeDocument();
  const frame = createLegacyObstaclesFrame(fakeDocument);

  assert.equal(frame.tagName, "iframe");
  assert.equal(frame.src, LEGACY_OBSTACLES_PATH);
  assert.equal(frame.title, "Legacy obstacles simulation");
  assert.equal(frame.attributes.loading, "eager");
  assert.equal(frame.style.border, "0");
  assert.equal(frame.style.width, "100vw");
  assert.equal(frame.style.height, "100vh");
});

test("mountLegacyObstaclesFrame replaces the body with the legacy iframe", () => {
  const fakeDocument = createFakeDocument();
  const frame = mountLegacyObstaclesFrame(fakeDocument);

  assert.equal(fakeDocument.documentElement.style.height, "100%");
  assert.equal(fakeDocument.body.style.margin, "0");
  assert.equal(fakeDocument.body.style.height, "100vh");
  assert.deepEqual(fakeDocument.body.children, [ frame ]);
});

test("main entrypoint mounts the legacy obstacles frame", async () => {
  const source = await readWorkspaceFile("../static/client/obstacles/main.js");

  assert.match(source, /mountLegacyObstaclesFrame/);
  assert.match(source, /mountLegacyObstaclesFrame\(document\)/);
});

test("collision system uses bounding-box quadtree rects", async () => {
  const source = await readWorkspaceFile("../static/shared/systems/collision.js");

  assert.match(source, /get quadTreeRect/);
  assert.match(source, /rect\.x = this\.minX/);
  assert.match(source, /rect\.y = this\.minY/);
  assert.match(source, /rect\.width = this\.width/);
  assert.match(source, /rect\.height = this\.height/);
  assert.match(source, /this\.quads\.insert\(c\.quadTreeRect\)/);
  assert.match(source, /this\.quads\.retrieve\(c\.quadTreeRect\)/);
  assert.match(source, /placementTree\.insert\(candidate\.quadTreeRect\)/);
  assert.match(source, /placementTree\.retrieve\(c\.quadTreeRect\)/);
  assert.match(source, /c_ = rect\.collision/);
});

test("legacy obstacles quadtree depth stays bounded in runtime and source", async () => {
  const [collisionSource, bootstrapSource, bundledMainSource, sourceCollision, sourceMain] = await Promise.all([
    readWorkspaceFile("../static/shared/systems/collision.js"),
    readWorkspaceFile("../static/client/obstacles/bootstrap.mjs"),
    readWorkspaceFile("../static/bundles/obstacles/main.js"),
    readWorkspaceFile("../src/shared/systems/collision.sibilant"),
    readWorkspaceFile("../src/client/obstacles/main.sibilant"),
  ]);

  assert.match(collisionSource, /var clampQuadTreeLevels/);
  assert.match(collisionSource, /createQuadTree\(width, height, maxObjects, maxLevels, 10\)/);
  assert.match(collisionSource, /createQuadTree\(world\[0\], world\[1\], 20, 500, 8\)/);
  assert.match(bootstrapSource, /Collision\.setBounds\(config\.dimensions\[0\], config\.dimensions\[1\], 500, 10\)/);
  assert.match(bundledMainSource, /Collision\.setBounds\(config\.worldDimensions\[0\], config\.worldDimensions\[1\], 500, 10\)/);
  assert.match(sourceCollision, /def clamp-quad-tree-levels/);
  assert.match(sourceCollision, /\.insert this\.quads c\.quad-tree-rect/);
  assert.match(sourceCollision, /\.retrieve this\.quads c\.quad-tree-rect/);
  assert.match(sourceMain, /\.set-bounds Collision \(first config\.dimensions\) \(second config\.dimensions\)[\s\S]*500[\s\S]*10/);
});

test("collision handler rewinds both sides and bounces the moving body", async () => {
  const [staticCollisionSource, bundledCollisionSource, sourceCollision] = await Promise.all([
    readWorkspaceFile("../static/client/obstacles/events/collision.js"),
    readWorkspaceFile("../static/bundles/obstacles/events/collision.js"),
    readWorkspaceFile("../src/client/obstacles/events/collision.sibilant"),
  ]);

  assert.match(staticCollisionSource, /v_\.pos\.x = \(v_\.priorX \|\| v_\.pos\.x\)/);
  assert.match(staticCollisionSource, /v_\.pos\.y = \(v_\.priorY \|\| v_\.pos\.y\)/);
  assert.match(staticCollisionSource, /const movingCollision=\(\(leftSpeed >= rightSpeed\) \? c : c_\)/);
  assert.match(staticCollisionSource, /game\.events\.emit\("simpleCollision", movingCollision, resistingCollision\)/);

  assert.match(bundledCollisionSource, /v_\.pos\.x = \(v_\.priorX \|\| v_\.pos\.x\)/);
  assert.match(bundledCollisionSource, /v_\.pos\.y = \(v_\.priorY \|\| v_\.pos\.y\)/);
  assert.match(bundledCollisionSource, /const movingCollision=\(\(leftSpeed >= rightSpeed\) \? c : c_\)/);
  assert.match(bundledCollisionSource, /game\.events\.emit\("simpleCollision", movingCollision, resistingCollision\)/);

  assert.match(sourceCollision, /assign v\*\.pos\.x \(or v\*\.prior-x v\*\.pos\.x\)/);
  assert.match(sourceCollision, /assign v\*\.pos\.y \(or v\*\.prior-y v\*\.pos\.y\)/);
  assert.match(sourceCollision, /const moving-collision \(if \(>= left-speed right-speed\) c c\*\)/);
  assert.match(sourceCollision, /\.emit game\.events 'simple-collision moving-collision resisting-collision/);
});

test("obstacles configs keep a wider steering angle zoom", async () => {
  const [staticConfigSource, bundledConfigSource] = await Promise.all([
    readWorkspaceFile("../static/client/obstacles/config.js"),
    readWorkspaceFile("../static/bundles/obstacles/config.js"),
  ]);

  assert.match(staticConfigSource, /config\.angleZoom = 48/);
  assert.match(bundledConfigSource, /module\.exports\.angleZoom = 12/);
});

test("bounding-box quadtree rects preserve overlaps that center-based rects miss", () => {
  const correctTree = new QuadTree({ x: 0, y: 0, width: 100, height: 100 }, 1, 4);
  const incorrectTree = new QuadTree({ x: 0, y: 0, width: 100, height: 100 }, 1, 4);

  const largeBoundsRect = { x: 30, y: 30, width: 40, height: 40, id: "large" };
  const smallBoundsRect = { x: 30, y: 30, width: 10, height: 10, id: "small" };
  const largeCenterRect = { x: 50, y: 50, width: 40, height: 40, id: "large" };
  const smallCenterRect = { x: 35, y: 35, width: 10, height: 10, id: "small" };

  correctTree.insert(largeBoundsRect);
  correctTree.insert(smallBoundsRect);
  incorrectTree.insert(largeCenterRect);
  incorrectTree.insert(smallCenterRect);

  const correctIds = correctTree.retrieve(smallBoundsRect).map(({ id }) => id).sort();
  const incorrectIds = incorrectTree.retrieve(smallCenterRect).map(({ id }) => id).sort();

  assert.deepEqual(correctIds, ["large", "small"]);
  assert.deepEqual(incorrectIds, ["small"]);
});

test("deep quadtree levels amplify broad-rect storage exponentially", () => {
  const shallowTree = new QuadTree({ x: 0, y: 0, width: 1024, height: 1024 }, 1, 4);
  const deepTree = new QuadTree({ x: 0, y: 0, width: 1024, height: 1024 }, 1, 8);

  shallowTree.insert({ x: 0, y: 0, width: 1024, height: 1024, id: "a" });
  shallowTree.insert({ x: 0, y: 0, width: 1024, height: 1024, id: "b" });
  deepTree.insert({ x: 0, y: 0, width: 1024, height: 1024, id: "a" });
  deepTree.insert({ x: 0, y: 0, width: 1024, height: 1024, id: "b" });

  const shallowCount = countStoredRects(shallowTree);
  const deepCount = countStoredRects(deepTree);

  assert.equal(shallowCount, 512);
  assert.equal(deepCount, 131072);
  assert.ok(deepCount > (shallowCount * 200));
});
