import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EspectaculosService } from './espectaculos.service';
import { Router, RouterModule } from '@angular/router'; 

// Simplificamos: el backend ya nos da las etiquetas correctas
const MAPA_CATEGORIAS: Record<string, string> = {
  'TEATRO': 'Teatro',
  'CONCIERTO': 'Concierto',
  'ESTADIO': 'Estadio'
};

interface EspectaculoDTO {
  id: number;
  artista: string;
  fecha: string;
  fechaAperturaTaquilla?: string;
  escenario: {
    nombre: string;
    tipo: 'TEATRO' | 'CONCIERTO' | 'ESTADIO';
  };
}

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
  
  escenarios: any[] = [];
  escenarioSeleccionado: any = null;
  
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
      next: (response) => this.escenarios = response,
      error: (err) => console.error('Error al cargar escenarios', err)
    });
  }

  private procesarEspectaculos(data: EspectaculoDTO[]) {
    const grupos = data.reduce((acc, current) => {
      if (!acc[current.artista]) {
        // Usamos directamente el tipo que viene del backend
        const categoria = MAPA_CATEGORIAS[current.escenario?.tipo] || 'Espectáculo';
        
        acc[current.artista] = {
          nombre: current.artista,
          categoria: categoria,
          totalFechas: 0,
          eventos: []
        };
      }
      acc[current.artista].eventos.push(current);
      acc[current.artista].totalFechas++;
      return acc;
    }, {} as any);

    Object.values(grupos).forEach((grupo: any) => {
      grupo.eventos.sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    });

    this.artistasAgrupados = Object.values(grupos);
    this.buscado = true;

    if (this.artistaSeleccionado) {
      this.seleccionarArtista(this.artistaSeleccionado);
    }
    
    this.cdr.detectChanges();
  }

  cargarTodos() {
    this.espectaculosService.buscarEspectaculos('').subscribe({
      next: (response) => this.procesarEspectaculos(response || []),
      error: (err) => console.error('Error al cargar espectaculos:', err)
    });
  }

  buscarPorArtista() {
    this.limpiarSeleccion();
    if (!this.busqueda.trim()) {
      this.cargarTodos();
      return;
    }
    this.espectaculosService.buscarEspectaculos(this.busqueda).subscribe({
      next: (response) => this.procesarEspectaculos(response || []),
      error: (err) => console.error('Error en búsqueda:', err)
    });
  }

  buscarPorEscenario() {
    this.limpiarSeleccion();
    this.busqueda = '';
    if (!this.escenarioSeleccionado) {
      this.cargarTodos();
      return;
    }
    this.espectaculosService.getEspectaculos(this.escenarioSeleccionado).subscribe({
      next: (response) => this.procesarEspectaculos(response || []),
      error: (err) => console.error('Error por escenario:', err)
    });
  }

  private limpiarSeleccion() {
    this.artistaSeleccionado = null;
    this.fechasDelArtista = [];
    this.artistasAgrupados = [];
  }

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

  irAComprar(espectaculo: EspectaculoDTO) {
    // Ya no necesitamos una función compleja, el dato está en escenario.tipo
    this.router.navigate(['/comprar'], {
      queryParams: {
        idEspectaculo: espectaculo.id,
        artista: espectaculo.artista,
        tipoEscenario: espectaculo.escenario?.tipo
      }
    });
  }

  irACola(espectaculo: EspectaculoDTO) {
    this.router.navigate(['/cola'], {
      queryParams: {
        espectaculoId: espectaculo.id,
        artista: espectaculo.artista
      }
    });
  }

  estaLogueado(): boolean {
    return typeof window !== 'undefined' && !!localStorage.getItem('tokenUsuario');
  }
}