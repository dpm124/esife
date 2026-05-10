import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class PerfilComponent implements OnInit {
  email: string = '';
  tokenUsuario: string = '';
  entradas: any[] = [];
  mensaje: string = '';
  mostrarModalCancelar: boolean = false;
  passwordCancelar: string = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.email = localStorage.getItem('emailUsuario') || '';
      this.tokenUsuario = localStorage.getItem('tokenUsuario') || '';
      if (this.email) {
        this.http.get<any[]>(`http://localhost:8080/compras/misEntradas?emailUsuario=${this.email}`)
          .subscribe({
            next: (data) => { this.entradas = [...data]; this.cdr.detectChanges(); },
            error: () => this.mensaje = 'No se pudieron cargar las entradas.'
          });
      }
    }
  }

  cancelarCuenta() {
    this.passwordCancelar = '';
    this.mensaje = '';
    this.mostrarModalCancelar = true;
  }

  confirmarCancelacion() {
    if (!this.passwordCancelar) return;

    this.http.post('http://localhost:8081/users/cancelar',
      { name: this.email, pwd: this.passwordCancelar, password: this.passwordCancelar },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.mostrarModalCancelar = false;
        localStorage.removeItem('tokenUsuario');
        localStorage.removeItem('emailUsuario');
        this.router.navigate(['/espectaculos']);
      },
      error: (err) => {
        this.mensaje = err.status === 401
          ? 'Contraseña incorrecta.'
          : 'Error al cancelar la cuenta. Inténtalo de nuevo.';
        this.mostrarModalCancelar = false;
        this.cdr.detectChanges();
      }
    });
  }

  cerrarModal() {
    this.mostrarModalCancelar = false;
    this.passwordCancelar = '';
  }

  cerrarSesion() {
    localStorage.removeItem('tokenUsuario');
    localStorage.removeItem('emailUsuario');
    this.router.navigate(['/espectaculos']);
  }

  descargarEntradas() {
    const url = `http://localhost:8080/compras/ticket/zip?emailUsuario=${this.email}`;
    window.open(url, '_blank');
  }

  volver() {
    this.router.navigate(['/espectaculos']);
  }
}