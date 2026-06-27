
## 5. Handshake & Discovery (IPC Initialization)

The `main.js` script manages a sophisticated IPC Router using named pipes (`codex-ipc` or `codex-ipc-${uid}.sock` on Unix, `\.\pipe\codex-ipc` on Windows).

### Router (`vO` class)
- **`start()`**: Sets up a server to listen for client connections.
- **`handleMessage(socket, message)`**: Routes messages based on their `type` (`broadcast`, `request`, `response`, `client-discovery-request`, `client-discovery-response`).
- **`initialize` method**: This is a special `request` method used by clients to register themselves with the router.
    - When a client sends an `initialize` request, the router:
        - Assigns a unique `clientId` (UUID).
        - Stores client metadata (socket, ID, type).
        - Broadcasts `client-status-changed` to other clients.
        - Responds with `success` including the `clientId`.
- **Client Discovery**: The router facilitates finding clients that can handle a specific request (e.g., `findClientForRequest`, `sendClientDiscoveryRequest`). If a `targetClientId` is specified, it forwards the request directly. Otherwise, it broadcasts a `client-discovery-request` and waits for a `client-discovery-response`.

### IPC Message Structure
- `type`: `broadcast`, `request`, `response`, `client-discovery-request`, `client-discovery-response`.
- `requestId`: Unique ID for requests/responses.
- `method`: For `request` messages (e.g., `initialize`).
- `sourceClientId`: ID of the client sending the message.
- `targetClientId`: Optional, for directing requests to a specific client.
- `resultType`: `success` or `error` for `response` messages.

### Key Observation: Microservices-like IPC
The IPC system functions like a lightweight microservices bus. Clients (e.g., the webview, worker threads, or potentially the Rust backend) register themselves, and the router handles message forwarding, discovery, and even timeout management for requests. This architecture allows different parts of the application to communicate without direct knowledge of each other's addresses.

## 6. Frontend Serving

- **Development**: `http://localhost:5175/` (Vite dev server).
- **Production**: Serves `app/webview/index.html`.
- **`tre` variable**: Indicates if the app is running in development mode (`ELECTRON_IS_DEV`).

## 7. Context Menu

The `main.js` also contains logic for custom context menus, including options for:
- Spell checking (`learnSpelling`, `dictionarySuggestions`).
- Text manipulation (`cut`, `copy`, `paste`, `selectAll`, `lookUpSelection`, `searchWithGoogle`).
- Media handling (`saveImage`, `saveImageAs`, `saveVideo`, `saveVideoAs`, `copyImage`, `copyImageAddress`, `copyVideoAddress`).
- Link handling (`copyLink`, `saveLinkAs`).
- Developer tools (`inspect`).
This is an Electron-specific feature and will need to be re-implemented using Tauri's native menu capabilities if desired.
