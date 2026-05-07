import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EspectaculosService } from '../espectaculos/espectaculos.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface EntradaUbicacion {
  tipo?: 'BUTACA' | 'ZONA' | 'DESCONOCIDO';
  descripcion?: string;
  planta?: number;
  fila?: number;
  butaca?: number;
  columna?: number;
  zona?: string;
}

interface EntradaDTO {
  id: number;
  precio: number;
  estado: string;
  nombreEspectaculo?: string;
  emailComprador?: string | null;
  ubicacion: EntradaUbicacion;
}

interface ZonaGrupo {
  nombre: string;
  entradas: EntradaDTO[];
}

interface FilaGrupo {
  fila: number;
  entradas: EntradaDTO[];
}

interface PlantaGrupo {
  planta: number;
  filas: FilaGrupo[];
}

@Component({
  selector: 'app-compra',
  imports: [CommonModule, FormsModule],
  templateUrl: './compra.html',
  styleUrl: './compra.css',
})
export class CompraComponent implements OnInit {
  idEspectaculo: string | null = null;
  artista: string | null = null;
  tipoEscenario: 'TEATRO' | 'CONCIERTO' | 'ESTADIO' | null = null;
  tipoEscenarioDesdeNavegacion: 'TEATRO' | 'CONCIERTO' | 'ESTADIO' | null = null;
  vistaForzadaPorEscenario: 'ZONA' | 'BUTACA' | null = null;
  entradas: EntradaDTO[] = [];
  vistaSeleccionada: 'ZONA' | 'BUTACA' = 'ZONA';
  vistasDisponibles = {
    ZONA: false,
    BUTACA: false,
  };
  tokenReservaEntrada: string | null = null;
  entradasSeleccionadas: EntradaDTO[] = [];
  mensaje: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private espectaculosService: EspectaculosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.idEspectaculo = params['idEspectaculo'];
      this.artista = params['artista'];
      this.tipoEscenarioDesdeNavegacion = this.normalizarTipoEscenario(params['tipoEscenario']);
      if (params['vista'] === 'BUTACA' || params['vista'] === 'ZONA') {
        this.vistaSeleccionada = params['vista'];
      }
      if (this.idEspectaculo) {
        this.cargarEntradas();
      }
    });
  }

  cargarEntradas() {
    this.espectaculosService.getEntradasConEscenario(this.idEspectaculo!).subscribe({
      next: (response: any) => {
        const tipoEscenarioBackend = this.normalizarTipoEscenario(response?.tipoEscenario);
        this.entradas = response.entradas || [];
        const tipoEscenarioPorTexto = this.inferirTipoEscenarioDesdeTexto(
          this.artista,
          this.entradas[0]?.nombreEspectaculo
        );
        if (tipoEscenarioPorTexto === 'TEATRO') {
          this.tipoEscenario = 'TEATRO';
        } else {
          this.tipoEscenario = this.tipoEscenarioDesdeNavegacion ?? tipoEscenarioBackend ?? tipoEscenarioPorTexto;
        }
        const vistasDetectadas = {
          ZONA: this.entradas.some((entrada) => entrada.ubicacion?.tipo === 'ZONA'),
          BUTACA: this.entradas.some((entrada) => entrada.ubicacion?.tipo === 'BUTACA'),
        };
        const vistaCorrespondiente = this.calcularVistaCorrespondiente(this.tipoEscenario, vistasDetectadas);
        this.vistaForzadaPorEscenario = vistaCorrespondiente;
        this.vistaSeleccionada = vistaCorrespondiente;
        this.vistasDisponibles = {
          ZONA: vistaCorrespondiente === 'ZONA',
          BUTACA: vistaCorrespondiente === 'BUTACA',
        };
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al cargar las entradas:', error);
      }
    });
  }

  get entradasVisibles(): EntradaDTO[] {
    return this.entradas.filter((entrada) => {
      const esDeEstaVista = entrada.ubicacion?.tipo === this.vistaSeleccionada;
      if (!esDeEstaVista) {
        return false;
      }
      if (this.vistaSeleccionada === 'ZONA') {
        return entrada.estado === 'DISPONIBLE';
      }
      return true;
    });
  }

  get zonasAgrupadas(): ZonaGrupo[] {
    const grupos = new Map<string, EntradaDTO[]>();
    this.entradasVisibles.forEach((entrada) => {
      const clave = this.obtenerNombreZona(entrada);
      const lista = grupos.get(clave) ?? [];
      lista.push(entrada);
      grupos.set(clave, lista);
    });
    return Array.from(grupos.entries())
      .map(([nombre, entradas]) => ({
        nombre,
        entradas: entradas.sort((a, b) => this.ordenEntrada(a) - this.ordenEntrada(b)),
      }))
      .sort((a, b) => this.compararNatural(a.nombre, b.nombre));
  }

  get plantasAgrupadas(): PlantaGrupo[] {
    const plantas = new Map<number, Map<number, EntradaDTO[]>>();
    this.entradasVisibles.forEach((entrada) => {
      const planta = this.obtenerNumeroPlanta(entrada);
      const fila = this.obtenerNumeroFila(entrada);
      if (!plantas.has(planta)) {
        plantas.set(planta, new Map<number, EntradaDTO[]>());
      }
      const filas = plantas.get(planta)!;
      const entradasFila = filas.get(fila) ?? [];
      entradasFila.push(entrada);
      filas.set(fila, entradasFila);
    });
    return Array.from(plantas.entries())
      .map(([planta, filas]) => ({
        planta,
        filas: Array.from(filas.entries())
          .map(([fila, entradas]) => ({
            fila,
            entradas: entradas.sort((a, b) => this.ordenEntrada(a) - this.ordenEntrada(b)),
          }))
          .sort((a, b) => a.fila - b.fila),
      }))
      .sort((a, b) => a.planta - b.planta);
  }

  get tieneAmbasVistas(): boolean {
    return false;
  }

  mostrarVista(vista: 'ZONA' | 'BUTACA') {
    if (!this.vistasDisponibles[vista]) {
      return;
    }
    this.vistaSeleccionada = vista;
    this.entradasSeleccionadas = [];
    this.tokenReservaEntrada = null;
    this.mensaje = null;
    this.cdr.detectChanges();
  }

  formatearUbicacion(entrada: EntradaDTO): string {
    const ubicacion = entrada.ubicacion;
    if (ubicacion.tipo === 'BUTACA') {
      const planta = ubicacion.planta ?? 'sin planta';
      const fila = ubicacion.fila ?? 'sin fila';
      const butaca = ubicacion.butaca ?? ubicacion.columna ?? 'sin butaca';
      return `Planta ${planta}, Fila ${fila}, Butaca ${butaca}`;
    }
    if (ubicacion.tipo === 'ZONA') {
      return ubicacion.zona ? `Zona ${ubicacion.zona}` : (ubicacion.descripcion ?? 'Zona sin nombre');
    }
    return ubicacion.descripcion ?? 'Ubicacion no disponible';
  }

  etiquetaUbicacion(entrada: EntradaDTO): string {
    const ubicacion = entrada.ubicacion;
    if (ubicacion.tipo === 'BUTACA') {
      const planta = this.obtenerNumeroPlanta(entrada);
      const fila = this.obtenerNumeroFila(entrada);
      const butaca = this.obtenerNumeroButaca(entrada);
      return `P${planta} · F${fila} · B${butaca}`;
    }
    if (ubicacion.tipo === 'ZONA') {
      return this.obtenerNombreZona(entrada);
    }
    return ubicacion.descripcion ?? 'Ubicacion';
  }

  etiquetaTarjeta(entrada: EntradaDTO): string {
    return `Entrada #${entrada.id} | ${this.etiquetaUbicacionCorta(entrada)}`;
  }

  private etiquetaUbicacionCorta(entrada: EntradaDTO): string {
    const ubicacion = entrada.ubicacion;
    if (ubicacion.tipo === 'BUTACA') {
      const numero = this.obtenerNumeroButaca(entrada);
      return numero > 0 ? `Butaca ${numero}` : 'Butaca';
    }
    if (ubicacion.tipo === 'ZONA') {
      return this.obtenerNombreZona(entrada);
    }
    return ubicacion.descripcion ?? 'Ubicacion';
  }

  etiquetaButaca(entrada: EntradaDTO): string {
    const numero = this.obtenerNumeroButaca(entrada);
    return numero > 0 ? `Butaca ${numero}` : 'Butaca';
  }

  butacasDisponiblesPorPlanta(planta: PlantaGrupo): number {
    return planta.filas.reduce((total, fila) => total + fila.entradas.length, 0);
  }

  filaEntrada(entrada: EntradaDTO): number {
    return this.obtenerNumeroFila(entrada);
  }

  ordenarEntradas(a: EntradaDTO, b: EntradaDTO): number {
    return this.ordenEntrada(a) - this.ordenEntrada(b);
  }

  private normalizarTipoEscenario(tipoEscenario: any): 'TEATRO' | 'CONCIERTO' | 'ESTADIO' | null {
    const valor = `${tipoEscenario ?? ''}`.trim().toUpperCase();
    if (valor === 'TEATRO' || valor === '1') {
      return 'TEATRO';
    }
    if (valor === 'CONCIERTO' || valor === '2') {
      return 'CONCIERTO';
    }
    if (valor === 'ESTADIO' || valor === '3') {
      return 'ESTADIO';
    }
    return null;
  }

  private inferirTipoEscenarioDesdeTexto(...campos: Array<any>): 'TEATRO' | 'CONCIERTO' | 'ESTADIO' | null {
    const texto = campos
      .filter((campo) => typeof campo === 'string')
      .map((campo) => `${campo}`.toUpperCase())
      .join(' ');
    if (!texto.trim()) {
      return null;
    }
    if (texto.includes('TEATRO') || texto.includes('OBRA') || texto.includes('DRAMA') || texto.includes('COMEDIA')) {
      return 'TEATRO';
    }
    if (texto.includes('ESTADIO') || texto.includes('ARENA') || texto.includes('PALACIO DE LOS DEPORTES')) {
      return 'ESTADIO';
    }
    if (texto.includes('CONCIERTO') || texto.includes('AUDITORIO') || texto.includes('FESTIVAL') || texto.includes('GIRA')) {
      return 'CONCIERTO';
    }
    return null;
  }

  private obtenerVistaForzadaPorEscenario(tipoEscenario: 'TEATRO' | 'CONCIERTO' | 'ESTADIO' | null): 'ZONA' | 'BUTACA' | null {
    if (tipoEscenario === 'TEATRO') {
      return 'BUTACA';
    }
    if (tipoEscenario === 'CONCIERTO' || tipoEscenario === 'ESTADIO') {
      return 'ZONA';
    }
    return null;
  }

  private calcularVistaCorrespondiente(
    tipoEscenario: 'TEATRO' | 'CONCIERTO' | 'ESTADIO' | null,
    vistasDetectadas: { ZONA: boolean; BUTACA: boolean }
  ): 'ZONA' | 'BUTACA' {
    const vistaPorEscenario = this.obtenerVistaForzadaPorEscenario(tipoEscenario);
    if (vistaPorEscenario) {
      return vistaPorEscenario;
    }
    if (vistasDetectadas.BUTACA && !vistasDetectadas.ZONA) {
      return 'BUTACA';
    }
    return 'ZONA';
  }

  private obtenerNombreZona(entrada: EntradaDTO): string {
    const zona = entrada.ubicacion.zona?.trim();
    if (zona) {
      return zona;
    }
    const descripcion = entrada.ubicacion.descripcion?.trim();
    if (descripcion) {
      return descripcion.replace(/^Zona:\s*/i, '');
    }
    return 'Zona sin nombre';
  }

  private obtenerNumeroPlanta(entrada: EntradaDTO): number {
    const planta = entrada.ubicacion.planta;
    return typeof planta === 'number' && !Number.isNaN(planta) ? planta : 0;
  }

  private obtenerNumeroFila(entrada: EntradaDTO): number {
    const fila = entrada.ubicacion.fila;
    return typeof fila === 'number' && !Number.isNaN(fila) ? fila : 0;
  }

  public obtenerNumeroButaca(entrada: EntradaDTO): number {
    const butaca = entrada.ubicacion.butaca ?? entrada.ubicacion.columna;
    return typeof butaca === 'number' && !Number.isNaN(butaca) ? butaca : 0;
  }

  private ordenEntrada(entrada: EntradaDTO): number {
    const butaca = this.obtenerNumeroButaca(entrada);
    return butaca > 0 ? butaca : entrada.id;
  }

  private compararNatural(a: string, b: string): number {
    const numA = Number.parseInt(a.replace(/\D+/g, ''), 10);
    const numB = Number.parseInt(b.replace(/\D+/g, ''), 10);
    const aTieneNumero = !Number.isNaN(numA);
    const bTieneNumero = !Number.isNaN(numB);
    if (aTieneNumero && bTieneNumero && numA !== numB) {
      return numA - numB;
    }
    return a.localeCompare(b, 'es', { sensitivity: 'base' });
  }

    seleccionar(entrada: EntradaDTO) {
    const yaSeleccionada = this.entradasSeleccionadas.some((e: EntradaDTO) => e.id === entrada.id)

    if (yaSeleccionada) {
      this.entradasSeleccionadas = this.entradasSeleccionadas.filter((e: EntradaDTO) => e.id !== entrada.id);
      if (this.entradasSeleccionadas.length === 0) {
        this.tokenReservaEntrada = null;
      }
      this.mensaje = 'Entrada deseleccionada.';
      this.cdr.detectChanges();
      return;
    }

    this.espectaculosService.reservarEntrada(entrada.id, this.tokenReservaEntrada || undefined).subscribe({
      next: (tokenReservaEntrada: string) => {
        this.tokenReservaEntrada = tokenReservaEntrada;
        this.entradasSeleccionadas = [...this.entradasSeleccionadas, entrada];
        this.mensaje = `✓ Entrada #${entrada.id} seleccionada. Precio: ${(entrada.precio / 100).toFixed(2)} €`;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.mensaje = error.error?.message || 'Error al seleccionar la entrada.';
        this.cdr.detectChanges();
      }
    });
  }

  estaSeleccionada(entrada: EntradaDTO): boolean {
    return this.entradasSeleccionadas.some(e => e.id === entrada.id);
  }

  volver() {
    this.router.navigate(['/espectaculos']);
  }

  tramitarCompra() {
    if (!this.tokenReservaEntrada || this.entradasSeleccionadas.length === 0) {
      this.mensaje = 'Selecciona una entrada primero.';
      this.cdr.detectChanges();
      return;
    }
    const tokenUsuario = localStorage.getItem('tokenUsuario');
    if (tokenUsuario) {
      this.router.navigate(['/pago'], {
        queryParams: {
          tokenReservaEntrada: this.tokenReservaEntrada,
          idEspectaculo: this.idEspectaculo,
          artista: this.artista
        }
      });
    } else {
      this.router.navigate(['/login'], {
        queryParams: {
          tokenReservaEntrada: this.tokenReservaEntrada,
          idEspectaculo: this.idEspectaculo,
          artista: this.artista
        }
      });
    }
  }
}