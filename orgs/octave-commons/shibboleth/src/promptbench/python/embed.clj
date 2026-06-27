(ns promptbench.python.embed
  "sentence-transformers bridge for text embedding via libpython-clj."
  (:require [libpython-clj2.python :as py]))

(defonce ^:private initialized? (atom false))
(defonce ^:private model-cache (atom {}))

(defn- add-nvidia-lib-paths!
  "Add NVIDIA shared-library directories so torch can find CUDA libraries
   (e.g. libcusparseLt.so) when running inside an embedded Python interpreter.
   Loads libs individually via ctypes on-demand. Must be called BEFORE importing torch."
  []
  (py/run-simple-string
    "import sys, os, glob, ctypes
# Locate nvidia packages under the pyenv site-packages.
ver = f'{sys.version_info.major}.{sys.version_info.minor}'
sp = os.path.join(sys.prefix, 'lib', f'python{ver}', 'site-packages', 'nvidia')
if os.path.isdir(sp):
    lib_dirs = sorted(glob.glob(os.path.join(sp, '*', 'lib')))
    existing = os.environ.get('LD_LIBRARY_PATH', '').split(':')
    for d in lib_dirs:
        if d not in existing:
            existing.insert(0, d)
    os.environ['LD_LIBRARY_PATH'] = ':'.join(p for p in existing if p)
"))

(defn ensure-python!
  "Ensure Python runtime is initialized. Idempotent.
   Also ensures site-packages paths are on sys.path and NVIDIA libs are loadable."
  []
  (when-not @initialized?
    (py/initialize!)
    ;; Ensure all site-packages directories are on sys.path.
    ;; The embedded Python interpreter started by libpython-clj may miss
    ;; the pyenv site-packages directory ({prefix}/lib/pythonX.Y/site-packages)
    ;; because site.getsitepackages() returns dist-packages on some installs.
    (py/run-simple-string
      "import sys, os, site
# Collect candidate paths to append (lower priority — fallback).
# The pyenv site-packages may not be on sys.path in the embedded interpreter.
# We append (not prepend) so user site-packages retains priority.
ver = f'{sys.version_info.major}.{sys.version_info.minor}'
candidates = [
    os.path.join(sys.prefix, 'lib', f'python{ver}', 'site-packages'),
]
candidates.extend(site.getsitepackages())
for p in candidates:
    if os.path.isdir(p) and p not in sys.path:
        sys.path.append(p)
# Also ensure user site-packages is present (should already be, but safety net).
usp = site.getusersitepackages()
if os.path.isdir(usp) and usp not in sys.path:
    sys.path.insert(0, usp)
")
    ;; Pre-load NVIDIA shared libraries before torch tries to import them.
    (add-nvidia-lib-paths!)
    ;; Patch MetadataPathFinder.invalidate_caches which has a broken classmethod
    ;; signature in some Python versions when called from torch's embedded importlib.
    (py/run-simple-string
      "import importlib.metadata as _im
if hasattr(_im, 'MetadataPathFinder'):
    _orig = _im.MetadataPathFinder.invalidate_caches
    @classmethod
    def _patched_invalidate_caches(cls):
        pass
    _im.MetadataPathFinder.invalidate_caches = _patched_invalidate_caches
")
    (reset! initialized? true)))

(defn- get-or-load-model
  "Get a cached model or load a new one. Models are cached by name
   to avoid repeated loading and GPU OOM issues."
  [model-name]
  (if-let [cached (get @model-cache model-name)]
    cached
    (let [st    (py/import-module "sentence_transformers")
          model (py/call-attr-kw st "SentenceTransformer"
                  [model-name]
                  {:device "cpu"})]
      (swap! model-cache assoc model-name model)
      model)))

(defn embed-batch
  "Embed a batch of texts using sentence-transformers via libpython-clj.
   Returns a vector of vectors, each of dimension matching the model
   (1024 for multilingual-e5-large). Embeddings are L2-normalized.

   Options:
     :batch-size  — number of texts per forward pass (default 256)

   Example:
     (embed-batch [\"hello\" \"world\"] \"intfloat/multilingual-e5-large\")"
  [texts model-name & {:keys [batch-size] :or {batch-size 256}}]
  (ensure-python!)
  (let [model      (get-or-load-model model-name)
        texts-py   (py/->py-list (vec texts))
        emb-np     (py/call-attr-kw model "encode"
                     [texts-py]
                     {:batch_size          batch-size
                      :show_progress_bar   false
                      :normalize_embeddings true})
        emb-list   (py/call-attr emb-np "tolist")]
    (mapv vec (py/->jvm emb-list))))
