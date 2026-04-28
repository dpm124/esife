import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recuperar',
  imports: [CommonModule, FormsModule],
  templateUrl: './recuperar.html',
  styleUrl: './recuperar.css',
})
export class Recuperar {
  email: string = '';
  mensaje: string | null = null;
  enviado: boolean = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  enviar() {
    this.http.post('http://localhost:8081/users/recuperar',
      { email: this.email },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.enviado = true;
        this.mensaje = 'Si el email existe, recibirás un correo con instrucciones.';
        this.cdr.detectChanges();
      },
      error: () => {
        // Mostramos el mismo mensaje aunque haya error (no revelamos si existe el email)
        this.enviado = true;
        this.mensaje = 'Si el email existe, recibirás un correo con instrucciones.';
        this.cdr.detectChanges();
      }
    });
  }

  volver() {
    this.router.navigate(['/login']);
  }
}