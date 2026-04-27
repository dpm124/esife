import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  
  tokenEntrada: string | null = null;
  espectaculoId: string | null = null;
  artista: string | null = null;
  name: string = '';
  pwd: string = '';
  mensaje: string | null = null;
  exito: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.tokenEntrada = params['tokenEntrada'] || null;
      this.espectaculoId = params['espectaculoId'] || null;
      this.artista = params['artista'] || null;
    });
  }

login() {
    this.http.post('http://localhost:8081/users/login', { name: this.name, pwd: this.pwd }, { responseType: 'text' })
      .subscribe({
        next: (tokenUsuario: string) => {
          if (this.espectaculoId) {
            // Venimos de la cola
            this.http.post('http://localhost:8080/cola/unirse', {}, {
              params: { espectaculoId: this.espectaculoId, tokenUsuario },
              responseType: 'text'
            }).subscribe({
              next: () => {
                this.router.navigate(['/cola'], {
                  queryParams: {
                    espectaculoId: this.espectaculoId,
                    artista: this.artista,
                    tokenUsuario: tokenUsuario
                  }
                });
              },
              error: (error: any) => {
                if (error.error?.includes('ya esta en la cola')) {
                  this.router.navigate(['/cola'], {
                    queryParams: {
                      espectaculoId: this.espectaculoId,
                      artista: this.artista,
                      tokenUsuario: tokenUsuario
                    }
                  });
                } else {
                  this.mensaje = error.error || 'Error al unirse a la cola.';
                }
              }
            });
          } else {
            // Venimos de una compra normal
            this.http.get('http://localhost:8080/reservas/comprar', {
              params: { tokenEntrada: this.tokenEntrada!, tokenUsuario },
              responseType: 'text'
            }).subscribe({
              next: () => {
                this.exito = true;
                this.mensaje = '¡Compra completada con éxito! Tu entrada está confirmada.';
                this.cdr.detectChanges();
              },
              error: (error: any) => {
                this.mensaje = error.error || 'Error al completar la compra.';
              }
            });
          }
        },
        error: (error: any) => {
          this.mensaje = error.error || 'Usuario o contraseña incorrectos.';
        }
      });
  }

  volver() {
    this.router.navigate(['/espectaculos']);
  }
}