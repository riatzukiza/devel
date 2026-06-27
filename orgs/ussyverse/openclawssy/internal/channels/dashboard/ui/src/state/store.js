export function createStore(initialState = {}) {
  let state = { ...initialState };
  const subscribers = new Set();

  function getState() {
    return state;
  }

  function notify() {
    for (const subscriber of subscribers) {
      subscriber(state);
    }
  }

  function setState(patch) {
    const nextState = typeof patch === "function" ? patch(state) : patch;
    if (!nextState || typeof nextState !== "object") {
      return;
    }
    state = { ...state, ...nextState };
    notify();
  }

  function subscribe(listener) {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  }

  return {
    getState,
    setState,
    subscribe,
  };
}
