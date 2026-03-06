import { Component } from '@angular/core';;
import { CommonModule } from '@angular/common';
import { EspectaculosService } from '../espectaculos.service';


@Component({
  selector: 'app-espectaculos',
  imports: [CommonModule],
  templateUrl: './espectaculos.html',
  styleUrl: './espectaculos.css',
})
export class EspectaculosComponent {

  escenarios: any[] = []
  escenarioAbiertoId: number | null = null // para almacenar el ID del escenario seleccionado
  router: any;

  constructor(private espectaculosService: EspectaculosService) {}

  getNumeroEntradas(espectaculo : any){
    this.espectaculosService.getNumeroEntradas(espectaculo).subscribe({
      next: (response: any) => {
        espectaculo.entradasTotales = response;
        this.getEntradasLibres(espectaculo);
      },
      error: (error : any) => {
        console.error("Error al obtener las entradas", error);
      }
    });  
  }

  getNumeroEntradasDto(espectaculo : any){
    this.espectaculosService.getNumeroEntradasDto(espectaculo).subscribe({
      next: (response: any) => {
        espectaculo.entradasTotales = response;
        this.getEntradasLibres(espectaculo);
      },
      error: (error : any) => {
        console.error("Error al obtener las entradas", error);
      }
    });  
  }
  

  getEntradasLibres(espectaculo: any) {
    this.espectaculosService.getEntradasLibres(espectaculo).subscribe({
      next: (response: any) => {
        espectaculo.entradasLibres = response;
      },
      error: (error: any) => {
        console.error("Error al obtener las entradas libres", error);
      }
    });
  }

  getEspectaculos(escenario: any) { // Usamos el ID del objeto escenario que llega desde el HTML
    this.espectaculosService.getEspectaculos(escenario).subscribe( // Suscribimos al observable para obtener los datos
      (response: any[]) => {
        this.escenarios = response
      },
      (error: any) => {
        console.error("Error al obtener los escenarios", error);
      }
    );
  }

  getEscenarios() {
    this.espectaculosService.getEscenarios().subscribe({
      next: (response) => {
        this.escenarios = response;
        this.escenarioAbiertoId = null; // Reiniciamos el escenario seleccionado al obtener nuevos escenarios
      },
      error: (error) => {
        console.error("Error al obtener escenarios", error);
      }
    });
  }

  toggleEscenario(escenario: any) {
    if (this.escenarioAbiertoId === escenario.id) {
      // Si el mismo escenario se vuelve a seleccionar, lo deseleccionamos
      this.escenarioAbiertoId = null;
      return;
    }

    if (!escenario.espectaculos || escenario.espectaculos.length === 0) {
      this.espectaculosService.getEspectaculos(escenario).subscribe({
        next: (response) => {
          escenario.espectaculos = response;
          this.escenarioAbiertoId = escenario.id;
          escenario.espectaculos.forEach((espectaculo: any) => this.getNumeroEntradas(espectaculo));
        },
        error: (error) => {
          console.error("Error al obtener espectáculos del escenario", error);
        }
      });
    } else {
      this.escenarioAbiertoId = escenario.id;
    }
  }

  irAComprar(espectaculo: any) {
    this.router.navigate(['/comprar']);
  }
}
