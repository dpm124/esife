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
   * Procesa la lista plana de espectáculos y la agrupa por Artista.
   * Mapea valores de tipo escenario con fallback robusto.
   */
  private procesarEspectaculos(data: any[]) {
    const grupos = data.reduce((acc, current) => {
      if (!acc[current.artista]) {
        const tipoMapeado = this.obtenerCategoriaEscenario(current);
        
        acc[current.artista] = {
          nombre: current.artista,
          categoria: tipoMapeado,
          totalFechas: 0,
          eventos: []
        };
      }
      acc[current.artista].eventos.push(current);
      acc[current.artista].totalFechas++;
      return acc;
    }, {} as any);

    // Ordenar cronológicamente las fechas dentro de cada artista para facilitar la selección
    Object.values(grupos).forEach((grupo: any) => {
      grupo.eventos.sort((a: any, b: any) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        return fechaA - fechaB;
      });
    });

    this.artistasAgrupados = Object.values(grupos);
    this.buscado = true;

    // Si el usuario estaba viendo un artista y los datos se actualizan, refrescamos su lista de fechas
    if (this.artistaSeleccionado) {
      this.seleccionarArtista(this.artistaSeleccionado);
    }
    
    this.cdr.detectChanges();
  }

  private obtenerCategoriaEscenario(espectaculo: any): string {
    const tipoEscenario = this.normalizarTipoEscenarioParaNavegacion(espectaculo);
    return this.mapearTipoEscenario(tipoEscenario);
  }

  private mapearTipoEscenario(tipo: any): string {
    const valorNormalizado = `${tipo}`.trim().toUpperCase();
    const mapa: { [key: string]: string } = {
      'TEATRO': 'Teatro',
      'CONCIERTO': 'Concierto',
      'ESTADIO': 'Estadio',
      '1': 'Teatro',
      '2': 'Concierto',
      '3': 'Estadio'
    };
    return mapa[valorNormalizado] || 'Espectaculo';
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

  cargarTodos() {
    this.espectaculosService.buscarEspectaculos('').subscribe({
      next: (response: any[]) => {
        this.procesarEspectaculos(response || []);
      },
      error: (error: any) => {
        console.error('Error al cargar espectaculos:', error);
        console.error('Estado HTTP:', error.status);
        console.error('Mensaje:', error.message);
      }
    });
  }

  buscarPorArtista() {
    // Limpiar estado completamente para evitar residuos
    this.escenarioSeleccionado = null;
    this.artistaSeleccionado = null;
    this.fechasDelArtista = [];
    this.artistasAgrupados = [];
    
    if (!this.busqueda.trim()) {
      this.cargarTodos();
      return;
    }
    
    this.espectaculosService.buscarEspectaculos(this.busqueda).subscribe({
      next: (response: any[]) => {
        this.procesarEspectaculos(response || []);
      },
      error: (error: any) => {
        console.error(`Error al buscar "${this.busqueda}":`, error);
        console.error('Estado HTTP:', error.status);
      }
    });
  }

  buscarPorEscenario() {
    // Limpiar estado completamente para evitar residuos
    this.busqueda = '';
    this.artistaSeleccionado = null;
    this.fechasDelArtista = [];
    this.artistasAgrupados = [];
    
    if (!this.escenarioSeleccionado) {
      this.cargarTodos();
      return;
    }
    
    this.espectaculosService.getEspectaculos(this.escenarioSeleccionado).subscribe({
      next: (response: any[]) => {
        this.procesarEspectaculos(response || []);
      },
      error: (error: any) => {
        console.error('Error al buscar por escenario:', error);
        console.error('Estado HTTP:', error.status);
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
    const tipoEscenario = this.normalizarTipoEscenarioParaNavegacion(espectaculo);
    this.router.navigate(['/comprar'], {
      queryParams: {
        idEspectaculo: espectaculo.id,
        artista: espectaculo.artista,
        tipoEscenario,
      }
    });
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

    const tipoInferido = this.inferirTipoEscenarioDesdeTexto(
      espectaculo?.escenario?.nombre,
      espectaculo?.artista,
      espectaculo?.nombre,
      espectaculo?.titulo
    );

    return tipoInferido;
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