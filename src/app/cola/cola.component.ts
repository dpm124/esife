import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EspectaculosService } from '../espectaculos/espectaculos.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cola',
  imports: [CommonModule],
  templateUrl: './cola.html',
  styleUrl: './cola.css',
})
export class ColaComponent implements OnInit, OnDestroy {

  espectaculoId!: number;
  artista!: string;
  tokenUsuario!: string;
  posicion: number | null = null;
  tieneTurno: boolean = false
  mensaje: string | null = null;
  intervalo: any;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service : EspectaculosService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.espectaculoId = +params['espectaculoId'];
      this.artista = params['artista'];
      this.tokenUsuario = params['tokenUsuario'];
      this.actualizarEstado();
      // Consulta la posición en la cola cada 10 segundos
      this.intervalo = setInterval(() => this.actualizarEstado(), 10000);
    });
  }

  ngOnDestroy() {
    clearInterval(this.intervalo);
  }

  actualizarEstado() {
    this.service.tieneTurno(this.espectaculoId, this.tokenUsuario).subscribe({
      next: (turno) => {
        this.tieneTurno = turno as boolean;
        if (this.tieneTurno) {
          this.mensaje = '¡Es tu turno! Puedes reservar tu entrada.';
        } else {
          this.service.consultarPosicionCola(this.espectaculoId, this.tokenUsuario).subscribe({
            next: (posicion) => {
              this.posicion = Number(posicion);
              this.mensaje = null;
            },
            error: () => {
              this.mensaje = 'Error al consultar la posición en la cola.';
            }
          });
        }
      },
      error: () => {
        this.mensaje = 'Error al consultar la posición en la cola.';
      }
    });
  }

  comprar() {
    this.router.navigate(['/comprar'], {
      queryParams: { idEspectaculo: this.espectaculoId, artista: this.artista }
    });
  }

  salir() {
    this.service.salirDeCola(this.espectaculoId, this.tokenUsuario).subscribe({
      next: () => this.router.navigate(['/espectaculos'])
    });
    }
}

