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

  // Devuelve todas las entradas de un espectáculo
  getEntradas(espectaculoId: any) {
    return this.http.get<any[]>(`http://localhost:8080/busqueda/getEntradas?espectaculoId=${espectaculoId}`);
  }

  // Devuelve solo las entradas disponibles de un espectáculo
  getEntradasDisponibles(espectaculoId: any) {
    return this.http.get<any[]>(`http://localhost:8080/busqueda/getEntradasDisponibles?espectaculoId=${espectaculoId}`);
  }

  // Devuelve estadísticas de entradas de un espectáculo
  getEstadisticasEspectaculo(espectaculoId: any) {
    return this.http.get<any>(`http://localhost:8080/busqueda/getNumeroEntradasDto/${espectaculoId}`);
  }

  reservarEntrada(entradaId: number, tokenReservaEntrada?: string) {
    const params = new URLSearchParams({ entradaId: String(entradaId) });
    if (tokenReservaEntrada) {
      params.append('tokenReservaEntrada', tokenReservaEntrada);
    }
    return this.http.put(
      `http://localhost:8080/reservas/reservar?${params.toString()}`,
      {},
      { responseType: 'text' }
    );
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
