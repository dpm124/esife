import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EspectaculosService } from '../espectaculos/espectaculos.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cola',
  imports: [CommonModule, FormsModule],
  templateUrl: './cola.html',
  styleUrl: './cola.css',
})
export class ColaComponent implements OnInit, OnDestroy {

  espectaculoId!: number;
  artista!: string;
  emailUsuario: string = '';
  enCola: boolean = false;
  posicion: number | null = null;
  tieneTurno: boolean = false;
  mensaje: string | null = null;
  intervalo: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: EspectaculosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.espectaculoId = +params['espectaculoId'];
      this.artista = params['artista'];
    });
  }

  ngOnDestroy() {
    clearInterval(this.intervalo);
  }

  unirse() {
    this.service.unirseACola(this.espectaculoId, this.emailUsuario).subscribe({
      next: () => {
        this.enCola = true;
        this.actualizarEstado();
        this.intervalo = setInterval(() => this.actualizarEstado(), 10000);
      },
      error: (error: any) => {
        if (error.error?.includes('ya esta en la cola')) {
          this.enCola = true;
          this.actualizarEstado();
          this.intervalo = setInterval(() => this.actualizarEstado(), 10000);
        } else {
          this.mensaje = error.error || 'Error al unirse a la cola.';
          this.cdr.detectChanges();
        }
      }
    });
  }

  actualizarEstado() {
    this.service.tieneTurno(this.espectaculoId, this.emailUsuario).subscribe({
      next: (turno) => {
        this.tieneTurno = turno as boolean;
        if (this.tieneTurno) {
          this.mensaje = '¡Es tu turno! Puedes reservar tu entrada.';
          this.posicion = null;
          this.cdr.detectChanges();
        } else {
          this.service.consultarPosicionCola(this.espectaculoId, this.emailUsuario).subscribe({
            next: (posicion) => {
              this.posicion = Number(posicion);
              this.mensaje = null;
              this.cdr.detectChanges();
            },
            error: () => {
              this.mensaje = 'Error al consultar la posición en la cola.';
              this.cdr.detectChanges();
            }
          });
        }
      },
      error: () => {
        this.mensaje = 'Error al consultar el turno.';
        this.cdr.detectChanges();
      }
    });
  }

  comprar() {
    this.router.navigate(['/comprar'], {
      queryParams: { idEspectaculo: this.espectaculoId, artista: this.artista }
    });
  }

  salir() {
    clearInterval(this.intervalo);
    this.service.salirDeCola(this.espectaculoId, this.emailUsuario).subscribe({
      next: () => this.router.navigate(['/espectaculos'])
    });
  }
}
