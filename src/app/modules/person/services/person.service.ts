import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { Person } from '../models/person.model';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  constructor(private http: HttpClient) { }

  getAllPersons(): Observable<Person[]> {
    return this.http.get<Person[]>(`${environment.personApiBaseUrl}/person`);
  }

  getFileAsync(id:number): Observable<Blob> {
    return this.http.get(`${environment.personApiBaseUrl}/person/file/`+ id, {responseType: 'blob'});
  }

  addPerson(person: any): Observable<void> {
    return this.http.post<void>(`${environment.personApiBaseUrl}/person`, person);
  }

  getPersonById(id: number): Observable<Person> {
    return this.http.get<Person>(`${environment.personApiBaseUrl}/person/`+ id, );
  }

  updatePerson(id: number, person: Person) : Observable<Person> {
    return this.http.put<Person>(`${environment.personApiBaseUrl}/person/`+ id, person);
  }

  deletePerson(id: number) : Observable<Person> {
    return this.http.delete<Person>(`${environment.personApiBaseUrl}/person/`+ id);
  }
}
