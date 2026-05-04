import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DtoRespuestaValidacionPasswd {
  strong: boolean;
  score: number;
  warning: string;
  suggestions: string[];
}

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
  mostrarPwd: boolean = false;
  mensaje: string | null = null;
  exito: boolean = false;
  modoRegistro: boolean = false;
  idEspectaculo: string | null = null;
  artista: string | null = null;
  passwordFeedback: DtoRespuestaValidacionPasswd | null = null;

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
    if (!this.isEmailValid()) {
      this.mensaje = 'Introduce un email válido (ejemplo: usuario@dominio.com)';
      this.cdr.detectChanges();
      return;
    }

    this.http.post('/users/login', { name: this.name, pwd: this.pwd, password: this.pwd }, { responseType: 'text' }).subscribe({
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
          if (error.status === 0) {
            // Error de conexión (servidor no responde)
            this.mensaje = '❌ No se pudo conectar con el servidor de usuarios.';
          } else if (error.status === 404) {
            this.mensaje = 'El usuario no existe. Por favor, regístrate primero.';
          } else if (error.status === 401) {
            this.mensaje = 'Usuario o contraseña incorrectos.';
          } else {
            this.mensaje = 'Error al conectar con el servidor.';
          }
          this.cdr.detectChanges();
        }
      });
    }

  registrar() {
    if (!this.isEmailValid()) {
      this.mensaje = 'Introduce un email válido (ejemplo: usuario@dominio.com)';
      this.cdr.detectChanges();
      return;
    }

    this.http.post('/users/registrar', { name: this.name, pwd: this.pwd, password: this.pwd }, { responseType: 'text' }).subscribe({
      next: () => {
        this.mensaje = 'Registro exitoso. Ahora puedes iniciar sesión.';
        this.modoRegistro = false;
        this.pwd = '';
        this.cdr.detectChanges();
        this.exito = true;
      },
      error: (error: any) => {
        console.error('Error registrar usuario:', error);
        // Mostrar mensaje del servidor cuando esté disponible, mantener el modoRegistro
        if (error.status === 0) {
          // Error de conexión (servidor no responde)
          this.mensaje = '❌ No se pudo conectar con el servidor de usuarios.';
        } else if (error.status === 409) {
          this.mensaje = 'El usuario ya existe.';
        } else {
          this.mensaje = error.error?.message || error.statusText || 'Error al registrar el usuario.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  isEmailValid(): boolean {
    const re = /\S+@\S+\.\S+/;
    return re.test(this.name);
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

  togglePasswordVisibility() {
    this.mostrarPwd = !this.mostrarPwd;
  }

  // ✓ NUEVO: Validación local de fuerza de contraseña (fallback si el servidor falla)
  calculatePasswordStrengthLocal(pwd: string): DtoRespuestaValidacionPasswd {
    let score = 0;
    let warning = '';
    const suggestions: string[] = [];

    if (pwd.length < 6) {
      warning = 'Demasiado corta (mínimo 6 caracteres)';
      suggestions.push('Añade más caracteres');
    } else if (pwd.length < 8) {
      score = 0;
      warning = 'Muy débil';
      suggestions.push('Añade mayúsculas, números o símbolos');
    } else {
      score = 1;
      if (!/[A-Z]/.test(pwd)) {
        suggestions.push('Añade mayúsculas (A-Z)');
      } else score++;
      
      if (!/[0-9]/.test(pwd)) {
        suggestions.push('Añade números (0-9)');
      } else score++;
      
      if (!/[^A-Za-z0-9]/.test(pwd)) {
        suggestions.push('Añade caracteres especiales (!@#$%^&*)');
      } else score++;
    }

    const strong = score >= 3;
    warning = warning || (strong ? '✓ Contraseña fuerte' : 'Añade variedad de caracteres');

    return { strong, score: Math.min(score, 4), warning, suggestions };
  }

  checkPasswordStrength() {
    if (!this.pwd || this.pwd.length < 4) {
      this.passwordFeedback = null;
      return;
    }
    this.http.post<DtoRespuestaValidacionPasswd>('/users/validar-password', 
      { name: this.name, pwd: this.pwd, password: this.pwd }
    ).subscribe({
      next: (res) => {
        this.passwordFeedback = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('No se pudo conectar con el servidor para validar contraseña. Usando validación local.', err);
        // Fallback: usar validación local si el servidor no responde
        this.passwordFeedback = this.calculatePasswordStrengthLocal(this.pwd);
        this.cdr.detectChanges();
      }
    });
  }
}