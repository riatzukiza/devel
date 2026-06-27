const createVisionFrame = (ref) => ({
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}.${Math.random()}`,
    ts: Date.now(),
    ref,
});
const appendFrame = (ring, frameEntity) => {
    const frames = [...ring.frames, frameEntity];
    const overflow = frames.length - ring.capacity;
    const trimmed = overflow > 0 ? frames.slice(overflow) : frames;
    return { ...ring, frames: trimmed };
};
export const pushVisionFrame = (world, agent, components, ref) => {
    const { VisionFrame, VisionRing } = components;
    const frameEntity = world.createEntity();
    world.addComponent(frameEntity, VisionFrame, createVisionFrame(ref));
    const ring = world.get(agent, VisionRing);
    if (!ring)
        return;
    const nextRing = appendFrame(ring, frameEntity);
    world.set(agent, VisionRing, nextRing);
};
//# sourceMappingURL=pushVision.js.map