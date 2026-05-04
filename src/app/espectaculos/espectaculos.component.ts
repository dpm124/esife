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
        // Mapear tipo de escenario con validación robusta
        const tipoRaw = current.escenario?.tipo || 'DESCONOCIDO';
        const tipoMapeado = this.mapearTipoEscenario(tipoRaw);
        
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

  /**
   * Mapea valores de tipo escenario a etiquetas legibles.
   * Soporta: TEATRO, CONCIERTO, ESTADIO, DESCONOCIDO
   */
  private mapearTipoEscenario(tipo: string): string {
    const mapa: { [key: string]: string } = {
      'TEATRO': 'Teatro',
      'CONCIERTO': 'Concierto',
      'ESTADIO': 'Estadio',
      'DESCONOCIDO': 'Espectáculo'
    };
    return mapa[tipo] || 'Espectáculo'; // Fallback final
  }

  cargarTodos() {
    console.log('🔄 Cargando todos los espectáculos...');
    this.espectaculosService.buscarEspectaculos('').subscribe({
      next: (response: any[]) => {
        console.log('✅ Respuesta recibida:', response);
        console.log('📊 Total de espectáculos:', response?.length || 0);
        if (!response || response.length === 0) {
          console.warn('⚠️ Lista vacía - Esto puede indicar que no hay datos en la BD');
        }
        this.procesarEspectaculos(response || []);
      },
      error: (error: any) => {
        console.error('❌ Error al cargar espectáculos:', error);
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
      console.log('🔍 Campo vacío - Cargando todos los espectáculos');
      this.cargarTodos();
      return;
    }
    
    console.log(`🔍 Buscando espectáculos de: "${this.busqueda}"`);
    this.espectaculosService.buscarEspectaculos(this.busqueda).subscribe({
      next: (response: any[]) => {
        console.log(`✅ Resultados encontrados: ${response?.length || 0}`);
        console.log('Datos recibidos:', response);
        if (!response || response.length === 0) {
          console.warn(`⚠️ No se encontraron espectáculos para "${this.busqueda}"`);
        }
        this.procesarEspectaculos(response || []);
      },
      error: (error: any) => {
        console.error(`❌ Error al buscar "${this.busqueda}":`, error);
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
      console.log('📍 Escenario no seleccionado - Cargando todos');
      this.cargarTodos();
      return;
    }
    
    console.log(`📍 Buscando espectáculos en: "${this.escenarioSeleccionado.nombre}"`);
    this.espectaculosService.getEspectaculos(this.escenarioSeleccionado).subscribe({
      next: (response: any[]) => {
        console.log(`✅ Encontrados ${response?.length || 0} espectáculos`);
        console.log('Datos:', response);
        if (!response || response.length === 0) {
          console.warn(`⚠️ No hay espectáculos en este escenario`);
        }
        this.procesarEspectaculos(response || []);
      },
      error: (error: any) => {
        console.error('❌ Error al buscar por escenario:', error);
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