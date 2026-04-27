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
  
  tokenEntrada: string | null = null
  name: string = '';
  pwd: string = '';
  mensaje: string | null = null;
  exito: boolean = false;
  modoRegistro: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.tokenEntrada = params['tokenEntrada'] || null
    });
  }

login() {
    this.http.post('http://localhost:8081/users/login', { name: this.name, pwd: this.pwd }, { responseType: 'text' })
      .subscribe({
        next: (tokenUsuario: string) => {
          localStorage.setItem('tokenUsuario', tokenUsuario);
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
              this.cdr.detectChanges();
            }
          });
        },
        error: () => {
          this.mensaje = 'Usuario o contraseña incorrectos.';
          this.cdr.detectChanges();
        }
      });
  }

  registrar() {
    this.http.post('http://localhost:8081/users/registrar', { name: this.name, pwd: this.pwd }, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.mensaje = 'Registro exitoso. Ahora puedes iniciar sesión.';
          this.modoRegistro = false;
          this.pwd = '';
          this.cdr.detectChanges();
          this.exito = true;
        },
        error: (error: any) => {
          this.mensaje = error.status === 409 ? 'El usuario ya existe.' : 'Error al registrar el usuario.';
          this.modoRegistro = false;
          this.cdr.detectChanges();
        }
      });
  }
  
  activarModoRegistro() {
    this.modoRegistro = true;
    this.mensaje = null;
    this.cdr.detectChanges();
  }

  volver() {
    this.router.navigate(['/espectaculos']);
  }
}