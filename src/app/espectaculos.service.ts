import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
<<<<<<< Updated upstream
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
=======

@Injectable({
  providedIn: 'root',
})
export class EspectaculosService {

  constructor(private http: HttpClient) {}

  getNumeroEntradasDto(espectaculo: any) {
    return this.http.get<any>(`http://localhost:8080/busqueda/getNumeroEntradasDto/${espectaculo.id}`);
  }
  
  getEscenarios() {
    return this.http.get<any[]>('http://localhost:8080/busqueda/getEscenarios');
  }

  getEspectaculos(escenario: any) {
    // Usamos el ID del objeto escenario que llega desde el HTML
    return this.http.get<any[]>(`http://localhost:8080/busqueda/getEspectaculos/${escenario.id}`);
  }

  getNumeroEntradas(espectaculo: any) {
    return this.http.get<any>(`http://localhost:8080/busqueda/getNumeroEntradas/${espectaculo.id}`);
  }

  getEntradasLibres(espectaculo: any) {
    return this.http.get<any>(`http://localhost:8080/busqueda/getEntradasLibres/${espectaculo.id}`);
>>>>>>> Stashed changes
  }
}
