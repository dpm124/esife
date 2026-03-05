import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EspectaculosService {
  private apiUrl = 'http://localhost:8080/api/escenarios'; // URL del backend Java

  constructor(private http: HttpClient) { }

  // Obtiene todos los escenarios del backend
  getEscenarios(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
