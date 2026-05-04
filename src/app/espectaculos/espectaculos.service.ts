import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EspectaculosService {

  constructor(private http: HttpClient) {}

  getEscenarios() {
    return this.http.get<any[]>('/busqueda/getEscenarios');
  }

  getEspectaculos(escenario: any) {
    return this.http.get<any[]>(`/busqueda/getEspectaculos/${escenario.id}`);
  }

  buscarEspectaculos(artista: string) {
    return this.http.get<any[]>(`/busqueda/getEspectaculos?artista=${artista}`);
  }

  // Devuelve la LISTA de entradas de un espectáculo (con id y precio)
  getEntradas(espectaculoId: any) {
    return this.http.get<any[]>(`/busqueda/getEntradas?espectaculoId=${espectaculoId}`);
  }

  // Devuelve el número de entradas libres (un número, no una lista)
  getEntradasLibres(espectaculoId: any) {
    return this.http.get<number>(`/busqueda/getEntradasLibres/${espectaculoId}`);
  }

  reservarEntrada(entradaId: number) {
    return this.http.put('/reservas/reservar?entradaId=' + entradaId, {}, { responseType: 'text' });
  }

  unirseACola(espectaculoId: number, emailUsuario: string) {
    return this.http.post('/cola/unirse', {}, {
      params: { espectaculoId, emailUsuario },
      responseType: 'text'
    });
  }

  consultarPosicionCola(espectaculoId: number, emailUsuario: string) {
    return this.http.get('/cola/posicion', {
      params: { espectaculoId, emailUsuario },
      responseType: 'text'
    });
  }

  tieneTurno(espectaculoId: number, emailUsuario: string) {
    return this.http.get<boolean>('/cola/turno', {
      params: { espectaculoId, emailUsuario } });
  }

  salirDeCola(espectaculoId: number, emailUsuario: string) {
    return this.http.delete('/cola/salir', {
      params: { espectaculoId, emailUsuario },
      responseType: 'text'
    });
  }
}
