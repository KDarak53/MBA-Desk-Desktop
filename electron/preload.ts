import { contextBridge, ipcRenderer } from 'electron';
import { IPC, AppConfig, Report, Upload } from '../src/types';

// Expose a minimal, typed API surface to the renderer.
// The renderer NEVER gets access to Node.js APIs directly.
contextBridge.exposeInMainWorld('mbaDesk', {
  /** Open a native file-picker and return the selected PDF path (or null if cancelled) */
  pickPdf: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC.PICK_PDF),

  /** Process a PDF through Gemini and return the saved report */
  processPdf: (filePath: string): Promise<Report> =>
    ipcRenderer.invoke(IPC.PROCESS_PDF, filePath),

  /** Fetch a previously-processed report from the local DB */
  getReport: (uploadId: number): Promise<Report | null> =>
    ipcRenderer.invoke(IPC.GET_REPORT, uploadId),

  /** List all past uploads */
  getAllUploads: (): Promise<Upload[]> =>
    ipcRenderer.invoke(IPC.GET_ALL_UPLOADS),

  /** Delete an upload + all its articles */
  deleteUpload: (uploadId: number): Promise<boolean> =>
    ipcRenderer.invoke(IPC.DELETE_UPLOAD, uploadId),

  /** Read the current app config */
  getConfig: (): Promise<AppConfig> =>
    ipcRenderer.invoke(IPC.GET_CONFIG),

  /** Persist app config (API key etc.) */
  saveConfig: (config: AppConfig): Promise<boolean> =>
    ipcRenderer.invoke(IPC.SAVE_CONFIG, config),

  /** Export the current report to PDF or Markdown via native save dialog */
  exportReport: (format: 'pdf' | 'markdown', uploadId: number): Promise<boolean> =>
    ipcRenderer.invoke(IPC.EXPORT_REPORT, { format, uploadId }),

  /** Open the userData directory in Explorer */
  openDataDir: (): Promise<boolean> =>
    ipcRenderer.invoke(IPC.OPEN_DATA_DIR),
});

// Expose a typed global so TypeScript knows about window.mbaDesk
declare global {
  interface Window {
    mbaDesk: {
      pickPdf: () => Promise<string | null>;
      processPdf: (filePath: string) => Promise<Report>;
      getReport: (uploadId: number) => Promise<Report | null>;
      getAllUploads: () => Promise<Upload[]>;
      deleteUpload: (uploadId: number) => Promise<boolean>;
      getConfig: () => Promise<AppConfig>;
      saveConfig: (config: AppConfig) => Promise<boolean>;
      exportReport: (format: 'pdf' | 'markdown', uploadId: number) => Promise<boolean>;
      openDataDir: () => Promise<boolean>;
    };
  }
}
