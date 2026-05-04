import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EspectaculosService } from './espectaculos.service';
import { Router, RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-espectaculos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './espectaculos.html',
  styleUrl: './espectaculos.css',
})
export class EspectaculosComponent implements OnInit {

  busqueda: string = '';
  buscado: boolean = false;
  
  // Datos maestros
  escenarios: any[] = [];
  escenarioSeleccionado: any = null;
  
  // Lógica de agrupación y navegación interna
  artistasAgrupados: any[] = []; 
  artistaSeleccionado: string | null = null;
  fechasDelArtista: any[] = [];

  constructor(
    private espectaculosService: EspectaculosService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

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

  /**
   * Procesa la lista plana de espectáculos y la agrupa por Artista
   */
  private procesarEspectaculos(data: any[]) {
    console.log('DEBUG: Primer espectáculo recibido:', data[0]); // DEBUG
    const grupos = data.reduce((acc, current) => {
      if (!acc[current.artista]) {
        acc[current.artista] = {
          nombre: current.artista,
          // Navegamos al tipo del escenario: current.escenario.tipo (TEATRO, CONCIERTO, ESTADIO)
          categoria: current.escenario?.tipo || 'Espectáculo',
          totalFechas: 0,
          eventos: []
        };
      }
      acc[current.artista].eventos.push(current);
      acc[current.artista].totalFechas++;
      return acc;
    }, {} as any);

    this.artistasAgrupados = Object.values(grupos);
    this.buscado = true;

    // Si el usuario estaba viendo un artista y los datos se actualizan, refrescamos su lista de fechas
    if (this.artistaSeleccionado) {
      this.seleccionarArtista(this.artistaSeleccionado);
    }
    
    this.cdr.detectChanges();
  }

  cargarTodos() {
    this.espectaculosService.buscarEspectaculos('').subscribe({
      next: (response: any[]) => {
        this.procesarEspectaculos(response);
      },
      error: (error: any) => {
        console.error('Error al cargar espectáculos', error);
      }
    });
  }

  buscarPorArtista() {
    this.escenarioSeleccionado = null;
    this.artistaSeleccionado = null; // Volvemos a la vista general al buscar
    this.espectaculosService.buscarEspectaculos(this.busqueda).subscribe({
      next: (response: any[]) => {
        this.procesarEspectaculos(response);
      },
      error: (error: any) => {
        console.error('Error al buscar espectáculos', error);
      }
    });
  }

  buscarPorEscenario() {
    this.busqueda = '';
    this.artistaSeleccionado = null; // Volvemos a la vista general al filtrar
    if (!this.escenarioSeleccionado) {
      this.cargarTodos();
      return;
    }
    this.espectaculosService.getEspectaculos(this.escenarioSeleccionado).subscribe({
      next: (response: any[]) => {
        this.procesarEspectaculos(response);
      },
      error: (error: any) => {
        console.error('Error al buscar por escenario', error);
      }
    });
  }

  // --- NAVEGACIÓN INTERNA ---

  seleccionarArtista(nombre: string) {
    this.artistaSeleccionado = nombre;
    const grupo = this.artistasAgrupados.find(a => a.nombre === nombre);
    this.fechasDelArtista = grupo ? grupo.eventos : [];
    this.cdr.detectChanges();
  }

  volverAArtistas() {
    this.artistaSeleccionado = null;
    this.fechasDelArtista = [];
    this.cdr.detectChanges();
  }

  // --- REDIRECCIONES ---

  irAComprar(espectaculo: any) {
    this.router.navigate(['/comprar'], {
      queryParams: {
        idEspectaculo: espectaculo.id,
        artista: espectaculo.artista,
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
}