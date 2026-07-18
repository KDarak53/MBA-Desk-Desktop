"use strict";
// ── Shared types used by both renderer and electron main (via IPC) ─────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC = exports.FUNCTIONS = void 0;
exports.FUNCTIONS = [
    'Finance',
    'Operations',
    'Marketing',
    'HR',
    'Product Management',
    'Analytics',
    'Consulting',
];
// IPC channel names (single source of truth)
exports.IPC = {
    PICK_PDF: 'pick-pdf',
    PROCESS_PDF: 'process-pdf',
    GET_REPORT: 'get-report',
    GET_ALL_UPLOADS: 'get-all-uploads',
    DELETE_UPLOAD: 'delete-upload',
    GET_CONFIG: 'get-config',
    SAVE_CONFIG: 'save-config',
    EXPORT_REPORT: 'export-report',
    OPEN_DATA_DIR: 'open-data-dir',
};
