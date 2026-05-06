import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './perfil.html',
})
export class PerfilComponent implements OnInit {
  email: string = '';
  tokenUsuario: string = '';
  entradas: any[] = [];
  mensaje: string = '';

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
    const password = prompt('Introduce tu contraseña para confirmar:');
    if (!password) return;

    this.http.post('http://localhost:8081/users/cancelar',
      { name: this.email, pwd: password, password: password },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        localStorage.removeItem('tokenUsuario');
        localStorage.removeItem('emailUsuario');
        alert('Cuenta cancelada correctamente.');
        this.router.navigate(['/espectaculos']);
      },
      error: () => this.mensaje = 'Contraseña incorrecta o error al cancelar la cuenta.'
    });
  }

  cerrarSesion() {
    localStorage.removeItem('tokenUsuario');
    localStorage.removeItem('emailUsuario');
    this.router.navigate(['/espectaculos']);
  }
}