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

  // Devuelve solo las entradas disponibles (¡Ahora ya incluyen el tipoEscenario dentro!)
  getEntradasDisponibles(espectaculoId: any) {
    return this.http.get<any[]>(`/busqueda/getEntradasDisponibles?espectaculoId=${espectaculoId}`);
  }

  // ¡NUEVO! Sustituye a getEntradasLibres. Llama al endpoint que mantuvimos en el Controller.
  // Devuelve un objeto con { totales, libres, vendidas, reservadas }
  getEstadisticasEspectaculo(espectaculoId: any) {
    return this.http.get<any>(`/busqueda/getNumeroEntradasDto/${espectaculoId}`);
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
      params: { espectaculoId, emailUsuario } 
    });
  }

  salirDeCola(espectaculoId: number, emailUsuario: string) {
    return this.http.delete('/cola/salir', {
      params: { espectaculoId, emailUsuario },
      responseType: 'text'
    });
  }
}