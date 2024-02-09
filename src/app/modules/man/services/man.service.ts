import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { Man } from '../models/man.model';

@Injectable({
  providedIn: 'root'
})
export class ManService {

  constructor(private http: HttpClient) { }

  getAllMen(): Observable<Man[]> {
    return this.http.get<Man[]>(`${environment.personApiBaseUrl}/men`);
  }

  addMan(man: Man): Observable<void> {
    return this.http.post<void>(`${environment.personApiBaseUrl}/men`, man);
  }

  getManById(id: number): Observable<Man> {
    return this.http.get<Man>(`${environment.personApiBaseUrl}/men/`+ id);
  }

  updateMan(id: number, man: Man) : Observable<Man> {
    return this.http.put<Man>(`${environment.personApiBaseUrl}/men/`+ id, man);
  }

  deleteMan(id: number) : Observable<Man> {
    return this.http.delete<Man>(`${environment.personApiBaseUrl}/men/`+ id);
  }
}
