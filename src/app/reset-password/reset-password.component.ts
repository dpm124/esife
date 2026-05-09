import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  token: string | null = null;
  pwd: string = '';
  mensaje: string | null = null;
  exito: boolean = false;
  mostrarPwd: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || null;
    });
  }

  resetear() {
    if (!this.token) {
      this.mensaje = 'Token inválido. Solicita de nuevo el correo de recuperación.';
      return;
    }

    this.http.post('http://localhost:8081/users/resetPassword',
      { token: this.token, pwd: this.pwd, password: this.pwd },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.exito = true;
        this.mensaje = 'Contraseña cambiada correctamente. Ya puedes iniciar sesión.';
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        if (error.status === 401) {
          this.mensaje = 'El enlace ha caducado o es inválido. Solicita uno nuevo.';
        } else if (error.status === 400) {
          this.mensaje = 'La contraseña no es suficientemente segura. Usa mayúsculas, números y caracteres especiales.';
        } else {
          this.mensaje = 'Error al cambiar la contraseña. Inténtalo de nuevo.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  togglePwd() {
    this.mostrarPwd = !this.mostrarPwd;
  }

  volver() {
    this.router.navigate(['/login']);
  }
}