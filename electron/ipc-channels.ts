// IPC channel constants — duplicated here to avoid cross-rootDir imports
// (single source of truth remains src/types.ts for the renderer)
export const IPC = {
  PICK_PDF:        'pick-pdf',
  PROCESS_PDF:     'process-pdf',
  GET_REPORT:      'get-report',
  GET_ALL_UPLOADS: 'get-all-uploads',
  DELETE_UPLOAD:   'delete-upload',
  GET_CONFIG:      'get-config',
  SAVE_CONFIG:     'save-config',
  EXPORT_REPORT:   'export-report',
  OPEN_DATA_DIR:   'open-data-dir',
} as const;
