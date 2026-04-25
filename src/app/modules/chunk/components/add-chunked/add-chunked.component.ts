import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { filter, firstValueFrom, map, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment.development';

type TabType = 'file' | 'url-frontend' | 'url-backend';

@Component({
  selector: 'app-add-chunked',
  templateUrl: './add-chunked.component.html',
  styleUrls: ['./add-chunked.component.scss']
})
export class AddChunkedComponent implements OnInit, OnDestroy {

  activeTab: TabType = 'file';
  chunkSizeMB: number = 1;
  get chunkSizeBytes(): number { return this.chunkSizeMB * 1024 * 1024; }

  // ============================================================
  // TAB 1: LOCAL FILE
  // ============================================================
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading: boolean = false;
  uploadComplete: boolean = false;
  uploadProgress: number = 0;
  uploadedChunks: number = 0;
  uploadId: string = '';
  errorMessage: string = '';
  uploadSpeed: string = '0 KB/s';
  uploadedSize: string = '0 KB';
  remainingSize: string = '0 KB';
  isDragging: boolean = false;
  currentStep: number = 1;

  // ✅ Duration tracking (Tab 1)
  uploadStartTimeMs: number = 0;
  uploadDurationMs: number = 0;
  uploadDurationText: string = '';

  private uploadAborted: boolean = false;

  // ============================================================
  // TAB 2: URL → FRONTEND → CHUNKS
  // ============================================================
  remoteUrl: string = '';
  urlPreviewUrl: string | null = null;
  urlDownloadedFile: File | null = null;
  urlDownloadInProgress: boolean = false;
  urlDownloadProgress: number = 0;
  urlUploadInProgress: boolean = false;
  urlUploadProgress: number = 0;
  urlUploadedChunks: number = 0;
  urlUploadComplete: boolean = false;
  urlUploadId: string = '';
  urlErrorMessage: string = '';

  // ✅ Duration tracking (Tab 2)
  urlStartTimeMs: number = 0;
  urlDurationMs: number = 0;
  urlDurationText: string = '';

  // ============================================================
  // TAB 3: URL → BACKEND DIRECT
  // ============================================================
  backendUrl: string = '';
  backendDownloadInProgress: boolean = false;
  backendDownloadProgress: number = 0;
  backendUploadComplete: boolean = false;
  backendErrorMessage: string = '';

  // ✅ Duration tracking (Tab 3)
  backendStartTimeMs: number = 0;
  backendDurationMs: number = 0;
  backendDurationText: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {}

  switchTab(tab: TabType): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.urlErrorMessage = '';
    this.backendErrorMessage = '';
  }

  // ============================================================
  // TAB 1: LOCAL FILE — Methods
  // ============================================================
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) this.setFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
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

  clearFile(event: MouseEvent): void {
    event.stopPropagation();
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

    // ✅ Upload শুরুর সময় নিন
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
      // Initialize — uploadMethod ও clientStartTimeMs পাঠান
      await firstValueFrom(this.http.post(
        `${environment.personApiBaseUrl}/chunkedupload/initialize`,
        {
          uploadId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          totalChunks,
          chunkSize: this.chunkSizeBytes,
          uploadMethod: 'LocalFile',              // ✅
          clientStartTimeMs: this.uploadStartTimeMs  // ✅
        }
      ));

      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        if (this.uploadAborted) break;

        const start = i * this.chunkSizeBytes;
        const end = Math.min(start + this.chunkSizeBytes, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', i.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileName', file.name);
        formData.append('chunk', chunk, file.name);

        await firstValueFrom(this.http.post(
          `${environment.personApiBaseUrl}/chunkedupload/upload-chunk`, formData
        ));

        this.uploadedChunks = i + 1;
        this.uploadProgress = Math.round(((i + 1) / totalChunks) * 100);
        this.updateStats(end);
      }

      if (!this.uploadAborted) {
        // ✅ Finalize — uploadMethod ও clientStartTimeMs পাঠান
        await firstValueFrom(this.http.post(
          `${environment.personApiBaseUrl}/chunkedupload/finalize`,
          {
            uploadId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            totalChunks,
            uploadMethod: 'LocalFile',              // ✅
            clientStartTimeMs: this.uploadStartTimeMs  // ✅
          }
        ));

        // ✅ Duration হিসাব করুন
        this.uploadDurationMs = Date.now() - this.uploadStartTimeMs;
        this.uploadDurationText = this.formatDuration(this.uploadDurationMs);

        this.uploadComplete = true;
        this.isUploading = false;
        this.uploadProgress = 100;
        this.currentStep = 3;
      }
    } catch (error: any) {
      this.errorMessage = error?.message || 'Upload failed. Please try again.';
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
    const speedBps = elapsed > 0 ? uploadedBytes / elapsed : 0;
    this.uploadSpeed = speedBps > 1024 * 1024
      ? (speedBps / (1024 * 1024)).toFixed(1) + ' MB/s'
      : (speedBps / 1024).toFixed(0) + ' KB/s';
    this.uploadedSize = this.formatBytes(uploadedBytes);
    const remaining = (this.selectedFile?.size || 0) - uploadedBytes;
    this.remainingSize = this.formatBytes(remaining > 0 ? remaining : 0);
  }

  // ============================================================
  // TAB 2: URL → FRONTEND → CHUNKS
  // ============================================================
  onUrlInput(): void {
    if (this.remoteUrl && this.isImageUrl(this.remoteUrl)) {
      this.urlPreviewUrl = this.remoteUrl;
    } else {
      this.urlPreviewUrl = null;
    }
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
      const response = await firstValueFrom(
        this.http.get(this.remoteUrl, {
          responseType: 'blob',
          observe: 'events',
          reportProgress: true
        }).pipe(
          tap(event => {
            if (event.type === HttpEventType.DownloadProgress) {
              if (event.total) {
                this.urlDownloadProgress = Math.round((event.loaded / event.total) * 100);
              } else {
                this.urlDownloadProgress = Math.min(99, Math.round((event.loaded / (1024 * 1024)) * 5));
              }
            }
          }),
          filter(event => event.type === HttpEventType.Response),
          map(event => (event as HttpResponse<Blob>).body)
        )
      );

      if (!response) throw new Error('Empty response from URL.');

      const fileName = this.getFileNameFromUrl(this.remoteUrl);
      this.urlDownloadedFile = new File([response], fileName, { type: response.type });
      this.urlDownloadProgress = 100;
      this.urlUploadId = this.generateUploadId();

      if (response.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => { this.urlPreviewUrl = reader.result as string; };
        reader.readAsDataURL(response);
      }
    } catch (error: any) {
      this.urlErrorMessage = 'Download failed: ' + (error?.message || 'CORS বা network error। Backend Direct mode ব্যবহার করুন।');
    } finally {
      this.urlDownloadInProgress = false;
    }
  }

  async uploadUrlFileAsChunks(): Promise<void> {
    if (!this.urlDownloadedFile || this.urlUploadInProgress) return;

    // ✅ Upload শুরুর সময় নিন
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
      // Initialize
      await firstValueFrom(this.http.post(
        `${environment.personApiBaseUrl}/chunkedupload/initialize`,
        {
          uploadId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          totalChunks,
          chunkSize: this.chunkSizeBytes,
          uploadMethod: 'UrlFrontend',         // ✅
          clientStartTimeMs: this.urlStartTimeMs  // ✅
        }
      ));

      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * this.chunkSizeBytes;
        const end = Math.min(start + this.chunkSizeBytes, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', i.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileName', file.name);
        formData.append('chunk', chunk, file.name);

        await firstValueFrom(this.http.post(
          `${environment.personApiBaseUrl}/chunkedupload/upload-chunk`, formData
        ));

        this.urlUploadedChunks = i + 1;
        this.urlUploadProgress = Math.round(((i + 1) / totalChunks) * 100);
      }

      // ✅ Finalize — uploadMethod ও clientStartTimeMs পাঠান
      await firstValueFrom(this.http.post(
        `${environment.personApiBaseUrl}/chunkedupload/finalize`,
        {
          uploadId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          totalChunks,
          uploadMethod: 'UrlFrontend',         // ✅
          clientStartTimeMs: this.urlStartTimeMs  // ✅
        }
      ));

      // ✅ Duration
      this.urlDurationMs = Date.now() - this.urlStartTimeMs;
      this.urlDurationText = this.formatDuration(this.urlDurationMs);

      this.urlUploadComplete = true;
      this.urlUploadProgress = 100;

    } catch (error: any) {
      this.urlErrorMessage = 'Upload failed: ' + (error?.message || 'Server error.');
    } finally {
      this.urlUploadInProgress = false;
    }
  }

  // ============================================================
  // TAB 3: URL → BACKEND DIRECT
  // ============================================================
  async uploadFromUrlBackend(): Promise<void> {
    if (!this.backendUrl || this.backendDownloadInProgress) return;

    // ✅ শুরুর সময় নিন
    this.backendStartTimeMs = Date.now();

    this.backendDownloadInProgress = true;
    this.backendDownloadProgress = 0;
    this.backendUploadComplete = false;
    this.backendErrorMessage = '';
    this.backendDurationMs = 0;
    this.backendDurationText = '';

    const progressInterval = setInterval(() => {
      if (this.backendDownloadProgress < 90) {
        this.backendDownloadProgress += Math.floor(Math.random() * 8) + 2;
      }
    }, 600);

    try {
      await firstValueFrom(
        this.http.post(
          `${environment.personApiBaseUrl}/chunkedupload/upload-from-url`,
          {
            url: this.backendUrl,
            uploadMethod: 'UrlBackend',               // ✅
            clientStartTimeMs: this.backendStartTimeMs // ✅
          }
        )
      );

      clearInterval(progressInterval);
      this.backendDownloadProgress = 100;

      // ✅ Duration
      this.backendDurationMs = Date.now() - this.backendStartTimeMs;
      this.backendDurationText = this.formatDuration(this.backendDurationMs);

      this.backendUploadComplete = true;

    } catch (error: any) {
      clearInterval(progressInterval);
      this.backendErrorMessage = 'Server download failed: ' + (error?.error?.message || error?.message || 'Unknown error.');
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

  getFileSizeString(file: File): string {
    return this.formatBytes(file.size);
  }

  isImageUrl(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase().split('?')[0];
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].some(ext => lower.endsWith(ext));
  }

  private getFileNameFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const name = pathname.substring(pathname.lastIndexOf('/') + 1);
      return decodeURIComponent(name) || 'downloaded-file';
    } catch {
      return 'downloaded-file';
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  // ✅ Duration format করুন
  formatDuration(ms: number): string {
    if (ms <= 0) return '—';
    if (ms < 1000) return `${ms}ms`;
    const totalSeconds = ms / 1000;
    if (totalSeconds < 60) return `${Math.round(totalSeconds * 10) / 10}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (minutes < 60) return `${minutes}m ${seconds}s`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m ${seconds}s`;
  }

  private generateUploadId(): string {
    return 'upload-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  goToList(): void {
    this.router.navigateByUrl('/chunk');
  }

  ngOnDestroy(): void {
    this.uploadAborted = true;
  }
}