import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EspectaculosService } from './espectaculos.service';
import { Router, RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-espectaculos',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './espectaculos.html',
  styleUrl: './espectaculos.css',
})
export class EspectaculosComponent implements OnInit {

  busqueda: string = '';
  espectaculos: any[] = [];
  escenarios: any[] = [];
  escenarioSeleccionado: any = null;
  buscado: boolean = false;

  constructor(private espectaculosService: EspectaculosService, private router: Router) {}

  ngOnInit(): void {
    this.cargarEscenarios();
    this.cargarTodos();
  }

  cargarEscenarios() {
    this.espectaculosService.getEscenarios().subscribe({
      next: (response: any[]) => {
        this.escenarios = response;
      },
      error: (error: any) => {
        console.error('Error al cargar escenarios', error);
      }
    });
  }

  cargarTodos() {
    this.espectaculosService.buscarEspectaculos('').subscribe({
      next: (response: any[]) => {
        this.espectaculos = response;
        this.buscado = true;
      },
      error: (error: any) => {
        console.error('Error al cargar espectáculos', error);
      }
    });
  }

  buscarPorArtista() {
    this.escenarioSeleccionado = null;
    this.buscado = true;
    this.espectaculosService.buscarEspectaculos(this.busqueda).subscribe({
      next: (response: any[]) => {
        this.espectaculos = response;
      },
      error: (error: any) => {
        console.error('Error al buscar espectáculos', error);
      }
    });
  }

  buscarPorEscenario() {
    this.busqueda = '';
    this.buscado = true;
    if (!this.escenarioSeleccionado) {
      this.cargarTodos();
      return;
    }
    this.espectaculosService.getEspectaculos(this.escenarioSeleccionado).subscribe({
      next: (response: any[]) => {
        this.espectaculos = response;
      },
      error: (error: any) => {
        console.error('Error al buscar por escenario', error);
      }
    });
  }

  irAComprar(espectaculo: any) {
    const tipoEscenario = this.normalizarTipoEscenarioParaNavegacion(espectaculo);
    this.router.navigate(['/comprar'], {
      queryParams: {
        idEspectaculo: espectaculo.id,
        artista: espectaculo.artista,
        tipoEscenario,
      }
    });
  }

  irACola(espectaculo: any) {
    this.router.navigate(['/cola'], {
      queryParams: {
        espectaculoId: espectaculo.id,
        artista: espectaculo.artista
      }
    });
  }

  estaLogueado(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('tokenUsuario');
  }

  private normalizarTipoEscenarioParaNavegacion(espectaculo: any): 'TEATRO' | 'CONCIERTO' | 'ESTADIO' | null {
    const tipoRaw = espectaculo?.escenario?.tipo ?? espectaculo?.tipoEscenario ?? espectaculo?.escenarioTipo;
    const valor = `${tipoRaw ?? ''}`.trim().toUpperCase();
    if (valor === 'TEATRO' || valor === '1') {
      return 'TEATRO';
    }
    if (valor === 'CONCIERTO' || valor === '2') {
      return 'CONCIERTO';
    }
    if (valor === 'ESTADIO' || valor === '3') {
      return 'ESTADIO';
    }
    return this.inferirTipoEscenarioDesdeTexto(
      espectaculo?.escenario?.nombre,
      espectaculo?.artista,
      espectaculo?.nombre,
      espectaculo?.titulo
    );
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
}
