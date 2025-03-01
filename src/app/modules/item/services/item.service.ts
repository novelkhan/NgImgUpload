import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { Item } from '../models/item.model';

@Injectable({
  providedIn: 'root'
})
export class ItemService {

  constructor(private http: HttpClient) { }
  
    getAllItems(): Observable<Item[]> {
      return this.http.get<Item[]>(`${environment.personApiBaseUrl}/item`);
    }
  
    addItem(item: Item): Observable<void> {
      return this.http.post<void>(`${environment.personApiBaseUrl}/item`, item);
    }
  
    getItemById(id: number): Observable<Item> {
      return this.http.get<Item>(`${environment.personApiBaseUrl}/item/`+ id);
    }
  
    /* updateItem(id: number, item: Item) : Observable<Item> {
      return this.http.put<Item>(`${environment.personApiBaseUrl}/item/`+ id, item);
    } */

    updateItem(id: number, item: Item): Observable<Item> {
      return this.http.put<Item>(`${environment.personApiBaseUrl}/item/${id}`, item);
    }
  
    deleteItem(id: number) : Observable<Item> {
      return this.http.delete<Item>(`${environment.personApiBaseUrl}/item/`+ id);
    }



    uploadFromUrl(url: string, connectionId: string) {
      return this.http.post(`${environment.personApiBaseUrl}/item/upload-from-url`, { 
        url: url, 
        connectionId: connectionId  // Ensure connectionId is sent in the request body
      });
    }
}
