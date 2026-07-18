import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from './ipc-channels';

// Expose a minimal, typed API surface to the renderer.
// The renderer NEVER gets access to Node.js APIs directly.
contextBridge.exposeInMainWorld('mbaDesk', {
  pickPdf: () => ipcRenderer.invoke('pick-pdf'),

  processPdf: (filePath: string, limit: string) => ipcRenderer.invoke('process-pdf', filePath, limit),

  getReport: (uploadId: number): Promise<unknown> =>
    ipcRenderer.invoke(IPC.GET_REPORT, uploadId),

  getAllUploads: () => ipcRenderer.invoke('db-get-uploads'),

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
