import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EspectaculosService } from '../espectaculos/espectaculos.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-compra',
  imports: [CommonModule, FormsModule],
  templateUrl: './compra.html',
  styleUrl: './compra.css',
})

export class CompraComponent implements OnInit {
  idEspectaculo: string | null = null;
  artista: string | null = null;
  entradas: any[] = [];
  tokenReservaEntrada: string | null = null;
  entradaSeleccionada: any = null;
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
      if (this.idEspectaculo) {
        this.cargarEntradas();
      }
    });
  }

  cargarEntradas() {
    this.espectaculosService.getEntradas(this.idEspectaculo!).subscribe({
      next: (response: any) => {
        this.entradas = [...response];
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al cargar las entradas:', error);
      }
    });
  }

  seleccionar(entrada: any) {
    if (this.entradaSeleccionada?.id === entrada.id) {
      this.entradaSeleccionada = null;
      this.tokenReservaEntrada = null;
      this.mensaje = 'Entrada deseleccionada.';
      this.cdr.detectChanges();
      return;
    }

    if (this.entradaSeleccionada) {
      this.entradaSeleccionada = null;
      this.tokenReservaEntrada = null;
    }

    this.espectaculosService.reservarEntrada(entrada.id).subscribe({
      next: (tokenReservaEntrada: string) => {  
        this.entradaSeleccionada = entrada;
        this.tokenReservaEntrada = tokenReservaEntrada; 
        this.mensaje = `✓ Entrada #${entrada.id} seleccionada. Precio: ${(entrada.precio / 100).toFixed(2)} €`;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.mensaje = error.error?.message || 'Error al seleccionar la entrada.';
        this.cdr.detectChanges();
      }
    });
  }

  estaSeleccionada(entrada: any): boolean {
    return this.entradaSeleccionada?.id === entrada.id;
  }

  volver() {
    this.router.navigate(['/espectaculos']);
  }

  tramitarCompra() {
    if (!this.tokenReservaEntrada) {
      this.mensaje = 'Selecciona una entrada primero.';
      this.cdr.detectChanges();
      return;
    }

    const tokenUsuario = localStorage.getItem('tokenUsuario');
    if (tokenUsuario) {
      // Ya está logueado, va directo al pago
      this.router.navigate(['/pago'], {
        queryParams: {
          tokenReservaEntrada: this.tokenReservaEntrada,
          idEspectaculo: this.idEspectaculo,
          artista: this.artista
        }
      });
    } else {
      // No está logueado, va al login
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