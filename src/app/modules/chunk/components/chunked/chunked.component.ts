import { Component, OnInit } from '@angular/core';
import { ChunkedUploadService } from '../../services/chunked-upload.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-chunked',
  templateUrl: './chunked.component.html',
  styleUrls: ['./chunked.component.scss']
})
export class ChunkedComponent implements OnInit {

  chunkedFiles: any[] = [];
  isLoading = true;

  constructor(
    private chunkedUploadService: ChunkedUploadService,
    private http: HttpClient
  ) {}

  ngOnInit(): void { this.loadFiles(); }

  loadFiles(): void {
    this.isLoading = true;
    this.chunkedUploadService.getAllFiles().subscribe({
      next: (files) => {
        // ✅ switching flag যোগ করুন প্রতিটি file এ
        this.chunkedFiles = files.map((f: any) => ({ ...f, switching: false }));
        this.isLoading = false;
      },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }

  // ✅ Storage Switch — এক ক্লিকে Folder ↔ Database
  switchStorage(file: any): void {
    if (file.switching) return;

    const target = file.storageType === 'Folder' ? 'Database' : 'Folder';
    const confirmMsg = `Move "${file.filename}" from ${file.storageType} to ${target}?`;
    if (!confirm(confirmMsg)) return;

    file.switching = true;

    this.http.post<any>(
      `${environment.personApiBaseUrl}/chunkedupload/switch-storage/${file.id}`,
      { targetStorage: target }
    ).subscribe({
      next: (res) => {
        // ✅ Local state আপডেট করুন — পেজ reload ছাড়াই
        file.previousStorageType = res.previousStorage;
        file.storageType = res.currentStorage;
        file.storageSwitchedAt = res.switchedAt;
        file.switching = false;
        console.log(`[StorageSwitch] ${res.message}`);
      },
      error: (err) => {
        console.error('Storage switch failed:', err);
        alert('Storage switch failed: ' + (err?.error?.message || err?.message || 'Unknown error'));
        file.switching = false;
      }
    });
  }

  downloadFile(file: any): void {
    this.chunkedUploadService.downloadFile(file.id).subscribe({
      next: (blob: Blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = file.filename;
        link.click();
        window.URL.revokeObjectURL(link.href);
      },
      error: (err) => console.error('Download error:', err)
    });
  }

  deleteFile(id: number): void {
    if (!confirm('Delete this file?')) return;
    this.chunkedUploadService.deleteFile(id).subscribe({
      next: () => { this.chunkedFiles = this.chunkedFiles.filter(f => f.id !== id); },
      error: (err) => console.error('Delete error:', err)
    });
  }

  generateDownloadLink(id: number): void {
    this.http.post<{ downloadLink: string }>(
      `${environment.personApiBaseUrl}/chunkedupload/generate-download-link/${id}`, {}
    ).subscribe({
      next: (res) => {
        alert(`Download Link:\n${res.downloadLink}`);
        navigator.clipboard.writeText(res.downloadLink)
          .then(() => alert('Link copied to clipboard!'));
      },
      error: (err) => console.error(err)
    });
  }

  // ===== Stats =====
  getTotalSize(): string {
    const total = this.chunkedFiles.reduce((a, f) => a + (f.rawFileSize || 0), 0);
    if (total === 0) return '—';
    if (total < 1024 * 1024) return (total / 1024).toFixed(1) + ' KB';
    return (total / (1024 * 1024)).toFixed(2) + ' MB';
  }

  getFolderCount(): number {
    return this.chunkedFiles.filter(f => f.storageType === 'Folder').length;
  }

  getDatabaseCount(): number {
    return this.chunkedFiles.filter(f => f.storageType === 'Database').length;
  }

  // ===== Upload Method =====
  getMethodLabel(method: string): string {
    const map: Record<string, string> = {
      LocalFile: 'Local File',
      UrlFrontend: 'URL → Frontend',
      UrlBackend: 'URL → Backend'
    };
    return map[method] || method || 'Unknown';
  }

  getMethodClass(method: string): string {
    const map: Record<string, string> = {
      LocalFile: 'method-badge method-badge--local',
      UrlFrontend: 'method-badge method-badge--frontend',
      UrlBackend: 'method-badge method-badge--backend'
    };
    return map[method] || 'method-badge';
  }

  getMethodIcon(method: string): string {
    const map: Record<string, string> = {
      LocalFile: '📁',
      UrlFrontend: '🌐',
      UrlBackend: '⚙️'
    };
    return map[method] || '📦';
  }

  // ===== File Helpers =====
  getExtension(filename: string): string {
    return filename?.split('.').pop()?.toUpperCase().substring(0, 4) || 'FILE';
  }

  getIconClass(filetype: string): string {
    if (!filetype) return 'type-default';
    if (filetype.startsWith('image')) return 'type-image';
    if (filetype.startsWith('video')) return 'type-video';
    if (filetype.startsWith('audio')) return 'type-audio';
    if (filetype.includes('pdf')) return 'type-pdf';
    if (filetype.includes('word') || filetype.includes('doc')) return 'type-doc';
    return 'type-default';
  }

  isImageType(filetype: string): boolean {
    return filetype?.startsWith('image/') || false;
  }

  getImageSrc(file: any): string {
    if (file.filestring) return `data:${file.filetype};base64,${file.filestring}`;
    return '';
  }

  onImgError(event: any): void {
    event.target.style.display = 'none';
  }
}