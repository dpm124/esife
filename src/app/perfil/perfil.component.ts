import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

// Definimos una interfaz para representar los eventos agrupados
interface EventoAgrupado {
  artista: string;
  fecha: string;
  precio: number;
  tickets: any[];
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css']
})
export class PerfilComponent implements OnInit {
  email: string = '';
  tokenUsuario: string = '';
  entradas: any[] = [];           // Lista plana original
  eventosAgrupados: EventoAgrupado[] = []; // Lista agrupada para la vista
  mensaje: string = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit() {
    // Verificamos si estamos en el navegador para acceder a localStorage
    if (isPlatformBrowser(this.platformId)) {
      this.email = localStorage.getItem('emailUsuario') || '';
      this.tokenUsuario = localStorage.getItem('tokenUsuario') || '';

      if (this.email) {
        this.cargarEntradas();
      }
    }
  }

  /**
   * Carga las entradas desde el microservicio de compras
   */
  cargarEntradas() {
    this.http.get<any[]>(`/compras/misEntradas?emailUsuario=${this.email}`)
      .subscribe({
        next: (data) => {
          this.entradas = data;
          this.agruparEntradas(data); // Transformamos los datos para la UI
          this.cdr.detectChanges(); // Forzamos la detección de cambios para SSR/Hydration
        },
        error: (err) => {
          console.error('Error al cargar:', err);
          this.mensaje = 'Error al conectar con el servidor.';
        }
      });
  }
private agruparEntradas(data: any[]) {
    // Si no hay datos, vaciamos el array para que se vea el mensaje de "No tienes entradas"
    if (!data || data.length === 0) {
      this.eventosAgrupados = [];
      return;
    }

    const grupos = data.reduce((acc, ticket) => {
      const clave = `${ticket.artista}-${ticket.fecha}`;
      if (!acc[clave]) {
        acc[clave] = {
          artista: ticket.artista,
          fecha: ticket.fecha,
          precio: ticket.precio,
          tickets: []
        };
      }
      acc[clave].tickets.push(ticket);
      return acc;
    }, {} as { [key: string]: EventoAgrupado });

    this.eventosAgrupados = Object.values(grupos);
  }

  descargarTodo(grupo: EventoAgrupado) {
  // 1. Extraemos los IDs y los unimos por comas (ej: "1,2,5")
  const listaIds = grupo.tickets.map(t => t.id).join(',');

  // 2. Llamamos al nuevo endpoint de ZIP
  const urlZip = `/compras/ticket/zip?ids=${listaIds}`;

  this.http.get(urlZip, { responseType: 'blob' })
    .subscribe({
      next: (blob: Blob) => {
        // 3. Creamos el link de descarga único
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Entradas_${grupo.artista.replace(/\s+/g, '_')}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.mensaje = 'No se pudo generar el archivo comprimido.';
      }
    });
}

  volver() { this.router.navigate(['/espectaculos']); }

  cerrarSesion() {
    localStorage.removeItem('tokenUsuario');
    localStorage.removeItem('emailUsuario');
    this.router.navigate(['/espectaculos']);
  }

  cancelarCuenta() {
    const password = prompt('Introduce tu contraseña para confirmar:');
    if (!password) return;
    this.http.post('/users/cancelar', { name: this.email, pwd: password, password: password }, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.cerrarSesion();
          alert('Cuenta cancelada.');
        },
        error: () => this.mensaje = 'Error al cancelar cuenta.'
      });
  }
}