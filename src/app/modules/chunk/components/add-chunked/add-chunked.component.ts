import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { filter, firstValueFrom, map, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment.development';

type TabType = 'file' | 'url-frontend' | 'url-backend';
type StorageType = 'Folder' | 'Database';

@Component({
  selector: 'app-add-chunked',
  templateUrl: './add-chunked.component.html',
  styleUrls: ['./add-chunked.component.scss']
})
export class AddChunkedComponent implements OnInit, OnDestroy {

  activeTab: TabType = 'file';
  chunkSizeMB: number = 1;

  // ✅ Storage selection — সব Tab এর জন্য একটাই
  selectedStorage: StorageType = 'Folder';

  get chunkSizeBytes(): number { return this.chunkSizeMB * 1024 * 1024; }

  // ============================================================
  // TAB 1: LOCAL FILE
  // ============================================================
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading = false;
  uploadComplete = false;
  uploadProgress = 0;
  uploadedChunks = 0;
  uploadId = '';
  errorMessage = '';
  uploadSpeed = '0 KB/s';
  uploadedSize = '0 KB';
  remainingSize = '0 KB';
  isDragging = false;
  currentStep = 1;
  uploadStartTimeMs = 0;
  uploadDurationMs = 0;
  uploadDurationText = '';
  private uploadAborted = false;

  // ============================================================
  // TAB 2: URL → FRONTEND → CHUNKS
  // ============================================================
  remoteUrl = '';
  urlPreviewUrl: string | null = null;
  urlDownloadedFile: File | null = null;
  urlDownloadInProgress = false;
  urlDownloadProgress = 0;
  urlUploadInProgress = false;
  urlUploadProgress = 0;
  urlUploadedChunks = 0;
  urlUploadComplete = false;
  urlUploadId = '';
  urlErrorMessage = '';
  urlStartTimeMs = 0;
  urlDurationMs = 0;
  urlDurationText = '';

  // ============================================================
  // TAB 3: URL → BACKEND DIRECT
  // ============================================================
  backendUrl = '';
  backendDownloadInProgress = false;
  backendDownloadProgress = 0;
  backendUploadComplete = false;
  backendErrorMessage = '';
  backendStartTimeMs = 0;
  backendDurationMs = 0;
  backendDurationText = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {}

  switchTab(tab: TabType): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.urlErrorMessage = '';
    this.backendErrorMessage = '';
  }

  // ============================================================
  // TAB 1: LOCAL FILE
  // ============================================================
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) this.setFile(file);
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.isDragging = true; }
  onDragLeave(e: DragEvent): void { e.preventDefault(); this.isDragging = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault(); e.stopPropagation(); this.isDragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File): void {
    this.selectedFile = file;
    this.uploadComplete = false;
    this.uploadProgress = 0;
    this.uploadedChunks = 0;
    this.errorMessage = '';
    this.uploadId = this.generateUploadId();
    this.uploadDurationMs = 0;
    this.uploadDurationText = '';
    this.currentStep = 2;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => { this.previewUrl = reader.result as string; };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  clearFile(e: MouseEvent): void {
    e.stopPropagation();
    this.selectedFile = null;
    this.previewUrl = null;
    this.uploadComplete = false;
    this.uploadProgress = 0;
    this.uploadedChunks = 0;
    this.errorMessage = '';
    this.uploadId = '';
    this.uploadDurationMs = 0;
    this.uploadDurationText = '';
    this.currentStep = 1;
  }

  onChunkSizeChange(): void {}

  async startChunkedUpload(): Promise<void> {
    if (!this.selectedFile || this.isUploading) return;

    this.uploadStartTimeMs = Date.now();
    this.isUploading = true;
    this.uploadComplete = false;
    this.uploadProgress = 0;
    this.uploadedChunks = 0;
    this.errorMessage = '';
    this.uploadAborted = false;
    this.uploadDurationMs = 0;
    this.uploadDurationText = '';
    this.currentStep = 3;

    const file = this.selectedFile;
    const totalChunks = this.getTotalChunks();
    const uploadId = this.uploadId || this.generateUploadId();
    this.uploadId = uploadId;

    try {
      await firstValueFrom(this.http.post(
        `${environment.personApiBaseUrl}/chunkedupload/initialize`,
        {
          uploadId, fileName: file.name, fileType: file.type,
          fileSize: file.size, totalChunks, chunkSize: this.chunkSizeBytes,
          uploadMethod: 'LocalFile',
          clientStartTimeMs: this.uploadStartTimeMs,
          storageType: this.selectedStorage   // ✅
        }
      ));

      for (let i = 0; i < totalChunks; i++) {
        if (this.uploadAborted) break;
        const start = i * this.chunkSizeBytes;
        const end = Math.min(start + this.chunkSizeBytes, file.size);
        const chunk = file.slice(start, end);

        const fd = new FormData();
        fd.append('uploadId', uploadId);
        fd.append('chunkIndex', i.toString());
        fd.append('totalChunks', totalChunks.toString());
        fd.append('fileName', file.name);
        fd.append('chunk', chunk, file.name);

        await firstValueFrom(this.http.post(
          `${environment.personApiBaseUrl}/chunkedupload/upload-chunk`, fd));

        this.uploadedChunks = i + 1;
        this.uploadProgress = Math.round(((i + 1) / totalChunks) * 100);
        this.updateStats(end);
      }

      if (!this.uploadAborted) {
        await firstValueFrom(this.http.post(
          `${environment.personApiBaseUrl}/chunkedupload/finalize`,
          {
            uploadId, fileName: file.name, fileType: file.type,
            fileSize: file.size, totalChunks,
            uploadMethod: 'LocalFile',
            clientStartTimeMs: this.uploadStartTimeMs,
            storageType: this.selectedStorage   // ✅
          }
        ));

        this.uploadDurationMs = Date.now() - this.uploadStartTimeMs;
        this.uploadDurationText = this.formatDuration(this.uploadDurationMs);
        this.uploadComplete = true;
        this.isUploading = false;
        this.uploadProgress = 100;
        this.currentStep = 3;
      }
    } catch (err: any) {
      this.errorMessage = err?.message || 'Upload failed.';
      this.isUploading = false;
      this.currentStep = 2;
    }
  }

  retryUpload(): void {
    this.errorMessage = '';
    this.uploadProgress = 0;
    this.uploadedChunks = 0;
    this.uploadDurationMs = 0;
    this.uploadDurationText = '';
    this.currentStep = 2;
  }

  private updateStats(uploadedBytes: number): void {
    const elapsed = (Date.now() - this.uploadStartTimeMs) / 1000;
    const bps = elapsed > 0 ? uploadedBytes / elapsed : 0;
    this.uploadSpeed = bps > 1024 * 1024
      ? (bps / (1024 * 1024)).toFixed(1) + ' MB/s'
      : (bps / 1024).toFixed(0) + ' KB/s';
    this.uploadedSize = this.formatBytes(uploadedBytes);
    const rem = (this.selectedFile?.size || 0) - uploadedBytes;
    this.remainingSize = this.formatBytes(rem > 0 ? rem : 0);
  }

  // ============================================================
  // TAB 2: URL → FRONTEND → CHUNKS
  // ============================================================
  onUrlInput(): void {
    this.urlPreviewUrl = this.isImageUrl(this.remoteUrl) ? this.remoteUrl : null;
    if (this.urlDownloadedFile) {
      this.urlDownloadedFile = null;
      this.urlDownloadProgress = 0;
      this.urlUploadProgress = 0;
      this.urlUploadedChunks = 0;
      this.urlUploadComplete = false;
      this.urlUploadId = '';
      this.urlDurationMs = 0;
      this.urlDurationText = '';
    }
  }

  clearUrl(): void {
    this.remoteUrl = '';
    this.urlPreviewUrl = null;
    this.urlDownloadedFile = null;
    this.urlDownloadProgress = 0;
    this.urlUploadProgress = 0;
    this.urlUploadedChunks = 0;
    this.urlUploadComplete = false;
    this.urlErrorMessage = '';
    this.urlUploadId = '';
    this.urlDurationMs = 0;
    this.urlDurationText = '';
  }

  async downloadFromUrlFrontend(): Promise<void> {
    if (!this.remoteUrl || this.urlDownloadInProgress) return;
    this.urlDownloadInProgress = true;
    this.urlDownloadProgress = 0;
    this.urlErrorMessage = '';
    this.urlDownloadedFile = null;

    try {
      const blob = await firstValueFrom(
        this.http.get(this.remoteUrl, {
          responseType: 'blob', observe: 'events', reportProgress: true
        }).pipe(
          tap(ev => {
            if (ev.type === HttpEventType.DownloadProgress) {
              this.urlDownloadProgress = ev.total
                ? Math.round((ev.loaded / ev.total) * 100)
                : Math.min(99, Math.round((ev.loaded / (1024 * 1024)) * 5));
            }
          }),
          filter(ev => ev.type === HttpEventType.Response),
          map(ev => (ev as HttpResponse<Blob>).body)
        )
      );

      if (!blob) throw new Error('Empty response.');
      const name = this.getFileNameFromUrl(this.remoteUrl);
      this.urlDownloadedFile = new File([blob], name, { type: blob.type });
      this.urlDownloadProgress = 100;
      this.urlUploadId = this.generateUploadId();

      if (blob.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => { this.urlPreviewUrl = reader.result as string; };
        reader.readAsDataURL(blob);
      }
    } catch (err: any) {
      this.urlErrorMessage = 'Download failed: ' + (err?.message || 'CORS/network error. Try Backend Direct.');
    } finally {
      this.urlDownloadInProgress = false;
    }
  }

  async uploadUrlFileAsChunks(): Promise<void> {
    if (!this.urlDownloadedFile || this.urlUploadInProgress) return;

    this.urlStartTimeMs = Date.now();
    const file = this.urlDownloadedFile;
    const totalChunks = this.getTotalChunksFromFile(file);
    const uploadId = this.urlUploadId || this.generateUploadId();
    this.urlUploadId = uploadId;
    this.urlUploadInProgress = true;
    this.urlUploadProgress = 0;
    this.urlUploadedChunks = 0;
    this.urlErrorMessage = '';
    this.urlDurationMs = 0;
    this.urlDurationText = '';

    try {
      await firstValueFrom(this.http.post(
        `${environment.personApiBaseUrl}/chunkedupload/initialize`,
        {
          uploadId, fileName: file.name, fileType: file.type,
          fileSize: file.size, totalChunks, chunkSize: this.chunkSizeBytes,
          uploadMethod: 'UrlFrontend',
          clientStartTimeMs: this.urlStartTimeMs,
          storageType: this.selectedStorage   // ✅
        }
      ));

      for (let i = 0; i < totalChunks; i++) {
        const start = i * this.chunkSizeBytes;
        const end = Math.min(start + this.chunkSizeBytes, file.size);
        const fd = new FormData();
        fd.append('uploadId', uploadId);
        fd.append('chunkIndex', i.toString());
        fd.append('totalChunks', totalChunks.toString());
        fd.append('fileName', file.name);
        fd.append('chunk', file.slice(start, end), file.name);
        await firstValueFrom(this.http.post(
          `${environment.personApiBaseUrl}/chunkedupload/upload-chunk`, fd));
        this.urlUploadedChunks = i + 1;
        this.urlUploadProgress = Math.round(((i + 1) / totalChunks) * 100);
      }

      await firstValueFrom(this.http.post(
        `${environment.personApiBaseUrl}/chunkedupload/finalize`,
        {
          uploadId, fileName: file.name, fileType: file.type,
          fileSize: file.size, totalChunks,
          uploadMethod: 'UrlFrontend',
          clientStartTimeMs: this.urlStartTimeMs,
          storageType: this.selectedStorage   // ✅
        }
      ));

      this.urlDurationMs = Date.now() - this.urlStartTimeMs;
      this.urlDurationText = this.formatDuration(this.urlDurationMs);
      this.urlUploadComplete = true;
      this.urlUploadProgress = 100;
    } catch (err: any) {
      this.urlErrorMessage = 'Upload failed: ' + (err?.message || 'Server error.');
    } finally {
      this.urlUploadInProgress = false;
    }
  }

  // ============================================================
  // TAB 3: URL → BACKEND DIRECT
  // ============================================================
  async uploadFromUrlBackend(): Promise<void> {
    if (!this.backendUrl || this.backendDownloadInProgress) return;

    this.backendStartTimeMs = Date.now();
    this.backendDownloadInProgress = true;
    this.backendDownloadProgress = 0;
    this.backendUploadComplete = false;
    this.backendErrorMessage = '';
    this.backendDurationMs = 0;
    this.backendDurationText = '';

    const interval = setInterval(() => {
      if (this.backendDownloadProgress < 90)
        this.backendDownloadProgress += Math.floor(Math.random() * 8) + 2;
    }, 600);

    try {
      await firstValueFrom(this.http.post(
        `${environment.personApiBaseUrl}/chunkedupload/upload-from-url`,
        {
          url: this.backendUrl,
          uploadMethod: 'UrlBackend',
          clientStartTimeMs: this.backendStartTimeMs,
          storageType: this.selectedStorage   // ✅
        }
      ));

      clearInterval(interval);
      this.backendDownloadProgress = 100;
      this.backendDurationMs = Date.now() - this.backendStartTimeMs;
      this.backendDurationText = this.formatDuration(this.backendDurationMs);
      this.backendUploadComplete = true;
    } catch (err: any) {
      clearInterval(interval);
      this.backendErrorMessage = 'Server download failed: ' + (err?.error?.message || err?.message || 'Unknown error.');
    } finally {
      this.backendDownloadInProgress = false;
    }
  }

  onBackendImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) img.style.display = 'none';
  }

  // ============================================================
  // Helpers
  // ============================================================
  getTotalChunks(): number {
    if (!this.selectedFile) return 0;
    return Math.ceil(this.selectedFile.size / this.chunkSizeBytes);
  }

  getChunkArray(): number[] {
    return Array.from({ length: Math.min(this.getTotalChunks(), 50) }, (_, i) => i);
  }

  getTotalChunksFromFile(file: File | null): number {
    if (!file) return 0;
    return Math.ceil(file.size / this.chunkSizeBytes);
  }

  getChunkArrayFromFile(file: File | null): number[] {
    if (!file) return [];
    return Array.from({ length: Math.min(this.getTotalChunksFromFile(file), 50) }, (_, i) => i);
  }

  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toUpperCase().substring(0, 4) || 'FILE';
  }

  getFileSizeString(file: File): string { return this.formatBytes(file.size); }

  isImageUrl(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase().split('?')[0];
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].some(e => lower.endsWith(e));
  }

  private getFileNameFromUrl(url: string): string {
    try {
      const p = new URL(url).pathname;
      const n = p.substring(p.lastIndexOf('/') + 1);
      return decodeURIComponent(n) || 'downloaded-file';
    } catch { return 'downloaded-file'; }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  formatDuration(ms: number): string {
    if (ms <= 0) return '—';
    if (ms < 1000) return `${ms}ms`;
    const s = ms / 1000;
    if (s < 60) return `${Math.round(s * 10) / 10}s`;
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    if (m < 60) return `${m}m ${sec}s`;
    return `${Math.floor(m / 60)}h ${m % 60}m ${sec}s`;
  }

  private generateUploadId(): string {
    return 'upload-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  goToList(): void { this.router.navigateByUrl('/chunk'); }
  ngOnDestroy(): void { this.uploadAborted = true; }
}