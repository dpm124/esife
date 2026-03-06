import { Component, ChangeDetectorRef } from '@angular/core';;
import { CommonModule } from '@angular/common';
import { EspectaculosService } from './espectaculos.service';
import { Router } from '@angular/router'; 


@Component({
  selector: 'app-espectaculos',
  imports: [CommonModule],
  templateUrl: './espectaculos.html',
  styleUrl: './espectaculos.css',
})
export class EspectaculosComponent {

  escenarios: any[] = []
  escenarioAbiertoId: number | null = null // para almacenar el ID del escenario seleccionado

  constructor(private espectaculosService: EspectaculosService, private router: Router, private changeDetectorRef: ChangeDetectorRef) {}

  getNumeroEntradas(espectaculo : any){
    this.espectaculosService.getNumeroEntradas(espectaculo).subscribe({
      next: (response: any) => {
        espectaculo.entradasTotales = response;
        this.getEntradasLibres(espectaculo);
        this.changeDetectorRef.detectChanges(); // Forzamos la detección de cambios para actualizar la vista
      },
      error: (error : any) => {
        console.error("Error al obtener las entradas", error);
      }
    });  
  }

  getNumeroEntradasDto(espectaculo : any){
    this.espectaculosService.getNumeroEntradasDto(espectaculo).subscribe({
      next: (response: any) => {
        espectaculo.datosEntradas = response;
        this.getEntradasLibres(espectaculo);
        this.changeDetectorRef.detectChanges(); // Forzamos la detección de cambios para actualizar la vista con los datos de entradas cargados
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
        this.changeDetectorRef.detectChanges(); // Forzamos la detección de cambios para actualizar la vista
      },
      error: (error: any) => {
        console.error("Error al obtener las entradas libres", error);
      }
    });
  }

  getEspectaculos(escenario: any) { // Usamos el ID del objeto escenario que llega desde el HTML
    this.espectaculosService.getEspectaculos(escenario).subscribe({ // Suscribimos al observable para obtener los datos
      next: (response: any[]) => {
        escenario.espectaculos = response; // Guardamos los espectáculos en el objeto escenario para que estén disponibles en el HTML
        escenario.espectaculos.forEach((espectaculo: any) => { // Iteramos sobre cada espectáculo del escenario
          this.getNumeroEntradasDto(espectaculo); // Llamamos a getNumeroEntradas para cada espectáculo para cargar sus estadísticas al inicio, así no tenemos que esperar a que el usuario haga clic en cada espectáculo para ver los datos
        });
        this.changeDetectorRef.detectChanges(); // Forzamos la detección de cambios para actualizar la vista con los espectáculos y estadísticas cargados
      },
      error: (error: any) => {
        console.error("Error al obtener los escenarios", error);
      }
    });
  }

  getEscenarios() {
    this.espectaculosService.getEscenarios().subscribe({
      next: (response) => {
        this.escenarios = response; // Guardamos los escenarios en la variable del componente
        this.escenarios.forEach((escenario: any) => { // Iteramos sobre cada escenario
          this.getEspectaculos(escenario); // Llamamos a getEspectaculos para cada escenario para cargar sus espectáculos y estadísticas al inicio, así no tenemos que esperar a que el usuario haga clic en cada escenario para ver los datos
        });
        this.changeDetectorRef.detectChanges(); // Forzamos la detección de cambios para actualizar la vista con los escenarios y espectáculos cargados
      },
      error: (error) => {
        console.error("Error al obtener escenarios", error);
      }
    });
  }

  irAComprar(espectaculo: any) {
    this.router.navigate(['/comprar'], {
      queryParams: {
        idEspectaculo: espectaculo.id,
        artista: espectaculo.artista,
      }
    });
  }
}
