import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from './ipc-channels';

// Expose a minimal, typed API surface to the renderer.
// The renderer NEVER gets access to Node.js APIs directly.
contextBridge.exposeInMainWorld('mbaDesk', {
  pickPdf: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC.PICK_PDF),

  processPdf: (filePath: string): Promise<unknown> =>
    ipcRenderer.invoke(IPC.PROCESS_PDF, filePath),

  getReport: (uploadId: number): Promise<unknown> =>
    ipcRenderer.invoke(IPC.GET_REPORT, uploadId),

  getAllUploads: (): Promise<unknown[]> =>
    ipcRenderer.invoke(IPC.GET_ALL_UPLOADS),

  deleteUpload: (uploadId: number): Promise<boolean> =>
    ipcRenderer.invoke(IPC.DELETE_UPLOAD, uploadId),

  getConfig: (): Promise<unknown> =>
    ipcRenderer.invoke(IPC.GET_CONFIG),

  saveConfig: (config: { geminiApiKey: string }): Promise<boolean> =>
    ipcRenderer.invoke(IPC.SAVE_CONFIG, config),

  exportReport: (format: 'pdf' | 'markdown', uploadId: number): Promise<boolean> =>
    ipcRenderer.invoke(IPC.EXPORT_REPORT, { format, uploadId }),

  openDataDir: (): Promise<boolean> =>
    ipcRenderer.invoke(IPC.OPEN_DATA_DIR),
});
