import { useMemo, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";

import { getSavedAuthToken, saveAuthToken } from "./lib/api";
import { ChatPage } from "./pages/ChatPage";
import { CredentialsPage } from "./pages/CredentialsPage";
import { ToolsPage } from "./pages/ToolsPage";

function navClass(isActive: boolean): string {
  return isActive ? "nav-link nav-link-active" : "nav-link";
}

export function App(): JSX.Element {
  const [tokenInput, setTokenInput] = useState(() => getSavedAuthToken());
  const hasToken = useMemo(() => tokenInput.trim().length > 0, [tokenInput]);

  const handleSaveToken = () => {
    saveAuthToken(tokenInput.trim());
  };

  return (
    <div className="shell-root">
      <header className="shell-header">
        <div className="shell-brand">
          <h1>Open Hax Proxy Console</h1>
          <p>Chat, credentials, tools, and MCP seeding in one control surface.</p>
        </div>

        <div className="shell-auth">
          <label htmlFor="proxy-token">Proxy Token</label>
          <div className="shell-auth-row">
            <input
              id="proxy-token"
              type="password"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.currentTarget.value)}
              placeholder="Bearer token for /api and /v1"
            />
            <button type="button" onClick={handleSaveToken}>
              Save
            </button>
          </div>
          <small>{hasToken ? "Token is set in local storage." : "No token set (works only if proxy allows unauthenticated access)."}</small>
        </div>
      </header>

      <nav className="shell-nav">
        <NavLink to="/" end className={({ isActive }) => navClass(isActive)}>
          Chat
        </NavLink>
        <NavLink to="/credentials" className={({ isActive }) => navClass(isActive)}>
          Credentials
        </NavLink>
        <NavLink to="/tools" className={({ isActive }) => navClass(isActive)}>
          Tools + MCP
        </NavLink>
      </nav>

      <main className="shell-main">
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/credentials" element={<CredentialsPage />} />
          <Route path="/tools" element={<ToolsPage />} />
        </Routes>
      </main>
    </div>
  );
}
