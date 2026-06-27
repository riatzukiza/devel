import type { GraphNode, ViewState } from "./types.js";
import { clamp } from "./utils.js";

export function attachGraphInteraction(params: {
  canvas: HTMLCanvasElement;
  getView: () => ViewState;
  setView: (next: ViewState) => void;
  requestRender: () => void;
  minScale: number;
  maxScale: number;
  zoomStep: number;
  pickRadiusPx: number;
  pick: (worldX: number, worldY: number, radiusWorld: number) => GraphNode | null;
  onPick: (node: GraphNode) => void;
}): () => void {
  const {
    canvas,
    getView,
    setView,
    requestRender,
    minScale,
    maxScale,
    zoomStep,
    pickRadiusPx,
    pick,
    onPick,
  } = params;

  const drag = {
    active: false,
    startX: 0,
    startY: 0,
    baseOffsetX: 0,
    baseOffsetY: 0,
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const view = getView();
    const wx = (px - cx - view.offsetX) / view.scale;
    const wy = (py - cy - view.offsetY) / view.scale;

    const factor = event.deltaY < 0 ? zoomStep : 1 / zoomStep;
    const nextScale = clamp(view.scale * factor, minScale, maxScale);

    setView({
      scale: nextScale,
      offsetX: px - cx - wx * nextScale,
      offsetY: py - cy - wy * nextScale,
    });
    requestRender();
  };

  const onPointerDown = (event: PointerEvent) => {
    const view = getView();
    drag.active = true;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.baseOffsetX = view.offsetX;
    drag.baseOffsetY = view.offsetY;
    canvas.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag.active) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const view = getView();
    setView({ ...view, offsetX: drag.baseOffsetX + dx, offsetY: drag.baseOffsetY + dy });
    requestRender();
  };

  const onPointerUp = (event: PointerEvent) => {
    const wasDragging = drag.active;
    const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    drag.active = false;
    canvas.releasePointerCapture?.(event.pointerId);

    if (!wasDragging || moved > 6) return;

    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const view = getView();
    const wx = (px - cx - view.offsetX) / view.scale;
    const wy = (py - cy - view.offsetY) / view.scale;
    const radiusWorld = pickRadiusPx / Math.max(1e-6, view.scale);

    const node = pick(wx, wy, radiusWorld);
    if (node) onPick(node);
  };

  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);

  return () => {
    canvas.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
  };
}
