const defaultRawVad = () => ({ level: 0, ts: 0 });
const defaultVad = () => ({
    active: false,
    lastTrueAt: 0,
    lastFalseAt: 0,
    attackMs: 120,
    releaseMs: 250,
    hangMs: 800,
    threshold: 0.5,
    _prevActive: false,
});
const toActive = (vad, now) => ({
    ...vad,
    active: true,
    lastTrueAt: now,
    _prevActive: vad.active,
});
const toInactive = (vad, now) => ({
    ...vad,
    active: false,
    lastFalseAt: now,
    _prevActive: vad.active,
});
const applyRawLevel = (vad, raw, now) => {
    const rawActive = raw.level >= vad.threshold;
    if (rawActive) {
        if (!vad.active && now - vad.lastFalseAt >= vad.attackMs) {
            return toActive(vad, now);
        }
        return { ...vad, lastTrueAt: now, _prevActive: vad.active };
    }
    if (vad.active && now - vad.lastTrueAt >= vad.releaseMs) {
        return toInactive(vad, now);
    }
    return { ...vad, lastFalseAt: now, _prevActive: vad.active };
};
const applyHang = (vad, now) => {
    if (vad.active && now - vad.lastTrueAt > vad.hangMs) {
        return toInactive(vad, now);
    }
    return vad;
};
const updateVad = (raw, previous, now) => applyHang(applyRawLevel(previous, raw, now), now);
const updateEntity = (world, components, entity) => {
    const { RawVAD, VAD } = components;
    const raw = world.get(entity, RawVAD) ?? defaultRawVad();
    const current = world.get(entity, VAD) ?? defaultVad();
    const next = updateVad(raw, current, Date.now());
    world.set(entity, VAD, next);
};
export const VADUpdateSystem = (world, components) => {
    const query = world.makeQuery({ all: [components.RawVAD, components.VAD] });
    return (_dt) => {
        for (const [entity] of world.iter(query))
            updateEntity(world, components, entity);
    };
};
//# sourceMappingURL=vad.js.map