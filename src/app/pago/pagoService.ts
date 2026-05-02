import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  constructor(private http: HttpClient) {}

  validarTokenUsuario(tokenUsuario: string): Observable<string> {
    return this.http.get(`http://localhost:8081/external/checkToken/${tokenUsuario}`, { responseType: 'text' });
  }

  prepararPago(data: { tokenReservaEntrada: string }): Observable<any> {
    return this.http.post('http://localhost:8080/pagos/prepararPago', data);
  }

  confirmarPago(data: { paymentIntentId: string; tokenUsuario: string }): Observable<any> {
    return this.http.post('http://localhost:8080/pagos/confirmar', data);
  }
}