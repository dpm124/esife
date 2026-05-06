import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EspectaculosService {

  constructor(private http: HttpClient) {}

  getEscenarios() {
    return this.http.get<any[]>('http://localhost:8080/busqueda/getEscenarios');
  }

  getEspectaculos(escenario: any) {
    return this.http.get<any[]>(`http://localhost:8080/busqueda/getEspectaculos/${escenario.id}`);
  }

  buscarEspectaculos(artista: string) {
    return this.http.get<any[]>(`http://localhost:8080/busqueda/getEspectaculos?artista=${artista}`);
  }

  // Devuelve la LISTA de entradas de un espectáculo (con id y precio)
  getEntradas(espectaculoId: any) {
    return this.http.get<any[]>(`http://localhost:8080/busqueda/getEntradas?espectaculoId=${espectaculoId}`);
  }

  // Devuelve el número de entradas libres (un número, no una lista)
  getEntradasLibres(espectaculoId: any) {
    return this.http.get<number>(`http://localhost:8080/busqueda/getEntradasLibres/${espectaculoId}`);
  }

  // Devuelve las entradas disponibles junto con el tipo de escenario
  getEntradasConEscenario(espectaculoId: any) {
    return this.http.get<any>(`http://localhost:8080/busqueda/getEntradasConEscenario?espectaculoId=${espectaculoId}`);
  }

  reservarEntrada(entradaId: number) {
    return this.http.put('http://localhost:8080/reservas/reservar?entradaId=' + entradaId, {}, { responseType: 'text' });
  }

  unirseACola(espectaculoId: number, emailUsuario: string) {
    return this.http.post('http://localhost:8080/cola/unirse', {}, {
      params: { espectaculoId, emailUsuario },
      responseType: 'text'
    });
  }

  consultarPosicionCola(espectaculoId: number, emailUsuario: string) {
    return this.http.get('http://localhost:8080/cola/posicion', {
      params: { espectaculoId, emailUsuario },
      responseType: 'text'
    });
  }

  tieneTurno(espectaculoId: number, emailUsuario: string) {
    return this.http.get<boolean>('http://localhost:8080/cola/turno', {
      params: { espectaculoId, emailUsuario } });
  }

  salirDeCola(espectaculoId: number, emailUsuario: string) {
    return this.http.delete('http://localhost:8080/cola/salir', {
      params: { espectaculoId, emailUsuario },
      responseType: 'text'
    });
  }
}
