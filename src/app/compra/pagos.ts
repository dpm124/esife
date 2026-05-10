import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Pagos {

  constructor(private http: HttpClient) {}

  prepararPago(info: any) {
    return this.http.post('http://localhost:8080/pagos/prepararPago', info);  
  };
}

