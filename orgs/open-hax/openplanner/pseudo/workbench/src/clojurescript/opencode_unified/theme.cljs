(ns opencode-unified.theme)

(defn global-styles []
  [:style
   "
:root {
  /* Monokai-like Palette */
  --bg-primary: #272822;
  --bg-secondary: #1e1f1c;
  --bg-tertiary: #171814;
  --bg-selection: #49483e;
  
  --text-primary: #f8f8f2;
  --text-secondary: #75715e;
  --text-dim: #5f5a60;
  
  --border: #3e3d32;
  --border-focus: #75715e;
  
  --accent-pink: #f92672;
  --accent-blue: #66d9ef;
  --accent-green: #a6e22e;
  --accent-orange: #fd971f;
  --accent-purple: #ae81ff;
  --accent-yellow: #e6db74;
  
  /* Functional mappings */
  --accent: var(--accent-blue);
  --success: var(--accent-green);
  --warning: var(--accent-orange);
  --error: var(--accent-pink);
  
  /* Dense Spacing */
  --spacing-xs: 2px;
  --spacing-sm: 4px;
  --spacing-md: 8px;
  --spacing-lg: 12px;
  --spacing-xl: 16px;
  
  /* Typography */
  --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  --font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-size-xs: 10px;
  --font-size-sm: 11px;
  --font-size-md: 13px;
  --font-size-lg: 15px;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-ui);
  font-size: var(--font-size-md);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}

/* Scrollbars */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--bg-selection);
  border: 2px solid var(--bg-secondary);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
"])
