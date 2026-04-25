// ==========================================
// ChunkedUpload Model  — chunked-upload.model.ts
// ==========================================
export interface ChunkedFileRecord {
  id?: number;
  fileName: string;
  fileType: string;
  fileSize: string;
  rawFileSize: number;
  fileUrl: string;
  totalChunks: number;
  uploadId: string;
  uploadedAt: string;
  downloadToken?: string;
  downloadTokenExpiration?: string;
}