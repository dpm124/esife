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
  
  tokenReservaEntrada: string | null = null
  name: string = '';
  pwd: string = '';
  mensaje: string | null = null;
  exito: boolean = false;
  modoRegistro: boolean = false;
  idEspectaculo: string | null = null;
  artista: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.tokenReservaEntrada = params['tokenReservaEntrada'] || null;
      this.idEspectaculo = params['idEspectaculo'] || null;
      this.artista = params['artista'] || null;
      if (params['registro'] === 'true') {
        this.modoRegistro = true;
      }
    });
  }

  login() {
    this.http.post('http://localhost:8081/users/login', { name: this.name, pwd: this.pwd }, { responseType: 'text' }).subscribe({
      next: (tokenUsuario: string) => {
        localStorage.setItem('tokenUsuario', tokenUsuario);
        localStorage.setItem('emailUsuario', this.name);
        // ✓ CAMBIO: Redirige a componente de pago, NO hace compra aquí
        this.exito = true;
        this.mensaje = '✓ Autenticación exitosa. Redirigiendo al pago...';
        this.cdr.detectChanges(); // Forzamos actualización para mostrar el mensaje antes de redirigir
          
        if (this.tokenReservaEntrada) {
          localStorage.setItem('tokenReservaEntrada', this.tokenReservaEntrada);
          this.router.navigate(['/pago'], { 
            queryParams: {
              tokenReservaEntrada: this.tokenReservaEntrada,
              idEspectaculo: this.idEspectaculo,
              artista: this.artista
            }
          });
        } else {
            this.router.navigate(['/espectaculos']);
          }
        },
        error: (error: any) => {
          if (error.status === 404) {
            this.mensaje = 'El usuario no existe. Por favor, regístrate primero.';
          } else {
            this.mensaje = 'Usuario o contraseña incorrectos.';
          }
          this.cdr.detectChanges();
        }
      });
    }

  registrar() {
    this.http.post('http://localhost:8081/users/registrar', { name: this.name, pwd: this.pwd }, { responseType: 'text' }).subscribe({
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

  irARecuperar() {
    this.router.navigate(['/recuperar']);
  }
}