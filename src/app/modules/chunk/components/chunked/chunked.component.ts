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
  isLoading: boolean = true;

  constructor(
    private chunkedUploadService: ChunkedUploadService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.isLoading = true;
    this.chunkedUploadService.getAllFiles().subscribe({
      next: (files) => {
        this.chunkedFiles = files;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading files:', err);
        this.isLoading = false;
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
      next: () => {
        this.chunkedFiles = this.chunkedFiles.filter(f => f.id !== id);
      },
      error: (err) => console.error('Delete error:', err)
    });
  }

  generateDownloadLink(id: number): void {
    this.http.post<{ downloadLink: string }>(
      `${environment.personApiBaseUrl}/chunkedupload/generate-download-link/${id}`, {}
    ).subscribe({
      next: (res) => {
        alert(`Download Link:\n${res.downloadLink}`);
        navigator.clipboard.writeText(res.downloadLink).then(() =>
          alert('Link copied to clipboard!')
        );
      },
      error: (err) => console.error(err)
    });
  }

  // ===== Helpers =====
  getTotalSize(): string {
    const totalBytes = this.chunkedFiles.reduce((acc, f) => acc + (f.rawFileSize || 0), 0);
    if (totalBytes === 0) return '—';
    if (totalBytes < 1024 * 1024) return (totalBytes / 1024).toFixed(1) + ' KB';
    return (totalBytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  getUniqueTypes(): number {
    return new Set(this.chunkedFiles.map(f => f.filetype?.split('/')[0])).size;
  }

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
    if (file.filestring) {
      return `data:${file.filetype};base64,${file.filestring}`;
    }
    return '';
  }

  onImgError(event: any): void {
    event.target.style.display = 'none';
  }
}