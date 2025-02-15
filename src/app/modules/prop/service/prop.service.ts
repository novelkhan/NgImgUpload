import { Injectable } from '@angular/core';
import { Prop } from '../models/prop.model';
import { environment } from '../../../../environments/environment.development';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PropService {

  constructor(private http: HttpClient) { }
    
      getAllProps(): Observable<Prop[]> {
        return this.http.get<Prop[]>(`${environment.personApiBaseUrl}/prop`);
      }
    
      addProp(prop: Prop): Observable<void> {
        return this.http.post<void>(`${environment.personApiBaseUrl}/prop`, prop);
      }
    
      getPropById(id: number): Observable<Prop> {
        return this.http.get<Prop>(`${environment.personApiBaseUrl}/prop/`+ id);
      }
    
      /* updateItem(id: number, item: Item) : Observable<Item> {
        return this.http.put<Item>(`${environment.personApiBaseUrl}/item/`+ id, item);
      } */
  
      updateProp(id: number, prop: Prop): Observable<Prop> {
        return this.http.put<Prop>(`${environment.personApiBaseUrl}/prop/${id}`, prop);
      }
    
      deleteProp(id: number) : Observable<Prop> {
        return this.http.delete<Prop>(`${environment.personApiBaseUrl}/prop/`+ id);
      }
  
  
  
      uploadFromUrl(url: string) {
        return this.http.post(`${environment.personApiBaseUrl}/prop/upload-from-url`, { url });
      }
}
