import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  constructor(private http: HttpClient) {}

  prepararPago(data: { tokenReservaEntrada: string }): Observable<any> {
    return this.http.post('/pagos/prepararPago', data);
  }

  confirmarPago(data: { paymentIntentId: string; tokenUsuario: string }): Observable<any> {
    return this.http.post('/pagos/confirmar', data);
  }
}