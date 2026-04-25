import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ChunkedUploadService {

  private baseUrl = `${environment.personApiBaseUrl}/chunkedupload`;

  constructor(private http: HttpClient) {}

  getAllFiles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}`);
  }

  getFileById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  downloadFile(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${id}`, { responseType: 'blob' });
  }

  deleteFile(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}