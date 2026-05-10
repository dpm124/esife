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
  tipoEscenario?: string;
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
  tipoEscenarioDesdeNavegacion: string | null = null;
  entradas: EntradaDTO[] = [];
  vistaSeleccionada: 'ZONA' | 'BUTACA' = 'ZONA';
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
      this.tipoEscenarioDesdeNavegacion = params['tipoEscenario'] ?? null;
      if (params['vista'] === 'BUTACA' || params['vista'] === 'ZONA') {
        this.vistaSeleccionada = params['vista'];
      }
      if (this.idEspectaculo) {
        this.cargarEntradas();
      }
    });
  }

  cargarEntradas() {
    this.espectaculosService.getEntradasDisponibles(this.idEspectaculo!).subscribe({
      next: (response: EntradaDTO[]) => {
        this.entradas = response || [];
        const tipoRaw = this.entradas[0]?.tipoEscenario ?? this.tipoEscenarioDesdeNavegacion;
        this.tipoEscenario = (tipoRaw as 'TEATRO' | 'CONCIERTO' | 'ESTADIO') ?? null;
        const vistasDetectadas = {
          ZONA: this.entradas.some((entrada) => entrada.ubicacion?.tipo === 'ZONA'),
          BUTACA: this.entradas.some((entrada) => entrada.ubicacion?.tipo === 'BUTACA'),
        };
        const vistaCorrespondiente = this.calcularVistaCorrespondiente(this.tipoEscenario, vistasDetectadas);
        this.vistaSeleccionada = vistaCorrespondiente;
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

  butacasDisponiblesPorPlanta(planta: PlantaGrupo): number {
    return planta.filas.reduce((total, fila) => total + fila.entradas.length, 0);
  }

  private calcularVistaCorrespondiente(
    tipoEscenario: 'TEATRO' | 'CONCIERTO' | 'ESTADIO' | null,
    vistasDetectadas: { ZONA: boolean; BUTACA: boolean }
  ): 'ZONA' | 'BUTACA' {
    if (tipoEscenario === 'TEATRO') return 'BUTACA';
    if (tipoEscenario === 'CONCIERTO' || tipoEscenario === 'ESTADIO') return 'ZONA';
    if (vistasDetectadas.BUTACA && !vistasDetectadas.ZONA) return 'BUTACA';
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