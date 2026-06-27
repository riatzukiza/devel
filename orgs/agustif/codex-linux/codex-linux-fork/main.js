const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Paths
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const appPath = isDev ? __dirname : path.dirname(app.getPath('exe'));
const resourcesPath = isDev 
  ? path.join(__dirname, 'resources')
  : process.resourcesPath;

const codexBinary = path.join(resourcesPath, 'codex');
const rgBinary = path.join(resourcesPath, 'rg');

let mainWindow;
let codexProcess;
let wsServer;
let wsPort = 9527;

function startCodexServer() {
  return new Promise((resolve, reject) => {
    // Check if binary exists
    if (!fs.existsSync(codexBinary)) {
      reject(new Error(`Codex binary not found at ${codexBinary}. Build it from OSS source.`));
      return;
    }

    // Make sure it's executable
    try {
      fs.chmodSync(codexBinary, 0o755);
    } catch (e) {
      console.warn('Could not chmod codex binary:', e.message);
    }

    const args = ['serve', '--websocket-port', String(wsPort)];
    
    codexProcess = spawn(codexBinary, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PATH: `${path.dirname(rgBinary)}:${process.env.PATH}`,
        // Allow custom API endpoints
        CODEX_APP_SERVER_WS_PORT: String(wsPort),
      }
    });

    codexProcess.stdout.on('data', (data) => {
      console.log(`[codex] ${data}`);
    });

    codexProcess.stderr.on('data', (data) => {
      console.error(`[codex stderr] ${data}`);
    });

    codexProcess.on('error', (err) => {
      console.error('Failed to start codex:', err);
      reject(err);
    });

    codexProcess.on('exit', (code, signal) => {
      console.log(`Codex server exited with code ${code}, signal ${signal}`);
    });

    // Wait a bit for server to start
    setTimeout(() => {
      resolve(wsPort);
    }, 1500);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Codex (Linux Fork)',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    show: false,
    icon: path.join(resourcesPath, 'icons', 'icon.png'),
  });

  // Set up CSP to allow WebSocket connections
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'none'; " +
          "img-src 'self' blob: data: https:; " +
          "child-src 'self' blob:; " +
          "frame-src 'self' blob:; " +
          "worker-src 'self' blob:; " +
          "script-src 'self' 'wasm-unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "font-src 'self' data:; " +
          "media-src 'self' blob:; " +
          "connect-src 'self' ws://localhost:* wss://localhost:* https://ab.chatgpt.com https://cdn.openai.com;"
        ]
      }
    });
  });

  // Load the webview UI
  const webviewPath = path.join(__dirname, 'webview', 'index.html');
  mainWindow.loadFile(webviewPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers for communicating with renderer
ipcMain.handle('get-ws-port', () => wsPort);
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);

// App lifecycle
app.whenReady().then(async () => {
  try {
    await startCodexServer();
    createWindow();
    
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (err) {
    console.error('Failed to start:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (codexProcess) {
    codexProcess.kill();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
