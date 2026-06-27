export const LEGACY_OBSTACLES_PATH = "/obstacles.html";

export const createLegacyObstaclesFrame = (documentLike, src = LEGACY_OBSTACLES_PATH) => {
  const frame = documentLike.createElement("iframe");

  frame.src = src;
  frame.title = "Legacy obstacles simulation";
  frame.setAttribute("loading", "eager");
  frame.style.border = "0";
  frame.style.display = "block";
  frame.style.width = "100vw";
  frame.style.height = "100vh";

  return frame;
};

export const mountLegacyObstaclesFrame = (documentLike, src = LEGACY_OBSTACLES_PATH) => {
  const frame = createLegacyObstaclesFrame(documentLike, src);

  documentLike.documentElement.style.height = "100%";
  documentLike.body.style.margin = "0";
  documentLike.body.style.height = "100vh";
  documentLike.body.replaceChildren(frame);

  return frame;
};
