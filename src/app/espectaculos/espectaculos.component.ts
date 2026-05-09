import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EspectaculosService } from './espectaculos.service';
import { Router, RouterModule } from '@angular/router'; 


const MAPA_TRADUCCION: Record<string, 'TEATRO' | 'CONCIERTO' | 'ESTADIO'> = {
  '1': 'TEATRO', 'TEATRO': 'TEATRO', 'OBRA': 'TEATRO',
  '2': 'CONCIERTO', 'CONCIERTO': 'CONCIERTO', 'GIRA': 'CONCIERTO',
  '3': 'ESTADIO', 'ESTADIO': 'ESTADIO', 'ARENA': 'ESTADIO'
};
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
    if (!tipo) return 'Espectáculo';
    // Ponemos la primera en mayúscula para que quede bonito (Teatro, Concierto...)
    return tipo.charAt(0) + tipo.slice(1).toLowerCase();
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
    // Sacamos el valor venga de donde venga
    const tipoRaw = espectaculo?.escenario?.tipo ?? espectaculo?.tipoEscenario ?? espectaculo?.escenarioTipo;
    if (!tipoRaw) return null;

    const valorKey = `${tipoRaw}`.trim().toUpperCase();
    
    // Si está en nuestro mapa, lo devolvemos. Si no, null.
    return MAPA_TRADUCCION[valorKey] || null;
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