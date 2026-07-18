import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { initDb } from './db';
import { getConfig, saveConfig } from './config';
import { processNewspaperPdf } from './gemini';
import { exportReport } from './export';
import { IPC } from './ipc-channels';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f172a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for preload to use require
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Open target="_blank" links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

// ── App lifecycle ──────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  await initDb();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC Handlers ───────────────────────────────────────────────────────────────

function registerIpcHandlers() {
  // Pick a PDF file via native dialog
  ipcMain.handle(IPC.PICK_PDF, async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Newspaper PDF',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // Process a PDF through Gemini and persist to DB
  ipcMain.handle(IPC.PROCESS_PDF, async (_event, filePath: string, limit: string) => {
    const cfg = getConfig();
    if (!cfg.geminiApiKey) {
      throw new Error('NO_API_KEY');
    }
    const report = await processNewspaperPdf(filePath, cfg.geminiApiKey, limit);
    return report;
  });

  // Fetch a saved report from DB
  ipcMain.handle(IPC.GET_REPORT, async (_event, uploadId: number) => {
    const { getReport } = await import('./db');
    return getReport(uploadId);
  });

  // List all past uploads
  ipcMain.handle(IPC.GET_ALL_UPLOADS, async () => {
    const { getAllUploads } = await import('./db');
    return getAllUploads();
  });

  // Delete an upload and all its articles
  ipcMain.handle(IPC.DELETE_UPLOAD, async (_event, uploadId: number) => {
    const { deleteUpload } = await import('./db');
    deleteUpload(uploadId);
    return true;
  });

  // Get app config (API key etc.)
  ipcMain.handle(IPC.GET_CONFIG, async () => {
    return getConfig();
  });

  // Save app config
  ipcMain.handle(IPC.SAVE_CONFIG, async (_event, config: { geminiApiKey: string }) => {
    saveConfig(config);
    return true;
  });

  // Export report to PDF or Markdown
  ipcMain.handle(IPC.EXPORT_REPORT, async (_event, { format, uploadId }: { format: 'markdown'; uploadId: number }) => {
    const { getReport } = await import('./db');
    const report = getReport(uploadId);
    if (!report) throw new Error('Report not found');

    const ext = 'md';
    const savePath = await dialog.showSaveDialog({
      title: 'Export Report',
      defaultPath: `${report.upload.filename.replace('.pdf', '')}-report.${ext}`,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });
    if (savePath.canceled || !savePath.filePath) return false;

    await exportReport(format, report, savePath.filePath, mainWindow!);
    return true;
  });

  // Open the userData data directory in Explorer
  ipcMain.handle(IPC.OPEN_DATA_DIR, async () => {
    shell.openPath(app.getPath('userData'));
    return true;
  });
}
