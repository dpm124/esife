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

  reservar(entrada: any) {
    this.espectaculosService.reservarEntrada(entrada.id).subscribe({
      next: (tokenReservaEntrada: string) => {  
        this.tokenReservaEntrada = tokenReservaEntrada; 
        this.mensaje = `✓ Entrada #${entrada.id} reservada por 10 minutos. 
                        Precio: ${(entrada.precio / 100).toFixed(2)} €
                        Completa tu compra para confirmar.`;
        this.cargarEntradas();  // Actualiza lista
      },
      error: (error: any) => {
        this.mensaje = error.error?.message || 'Error al reservar la entrada.';
      }
    });
  }

  volver() {
    this.router.navigate(['/espectaculos']);
  }

  completarCompra() {
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