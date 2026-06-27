function normalizeRoute(value) {
  const raw = (value || "").trim();
  if (!raw) {
    return "/chat";
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function createHashRouter(options = {}) {
  const { routes = [], defaultRoute = "/chat", onRouteChange = () => {} } = options;
  const known = new Set(routes.map((route) => normalizeRoute(route.path)));

  function getHashRoute() {
    const hash = window.location.hash.replace(/^#/, "");
    const [pathPart] = hash.split("?");
    const route = normalizeRoute(pathPart || defaultRoute);
    if (!known.has(route)) {
      return normalizeRoute(defaultRoute);
    }
    return route;
  }

  function applyRoute() {
    const route = getHashRoute();
    onRouteChange(route);
  }

  function navigate(path) {
    const normalized = normalizeRoute(path);
    window.location.hash = `#${normalized}`;
  }

  function start() {
    window.addEventListener("hashchange", applyRoute);
    if (!window.location.hash) {
      navigate(defaultRoute);
      return;
    }
    applyRoute();
  }

  return {
    start,
    navigate,
    current: () => getHashRoute(),
  };
}
