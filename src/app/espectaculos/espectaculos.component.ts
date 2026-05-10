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
