import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
<<<<<<< Updated upstream
import { Espectaculos } from './espectaculos/espectaculos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Espectaculos],
=======
import { EspectaculosComponent } from './espectaculos/espectaculos.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EspectaculosComponent],
>>>>>>> Stashed changes
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('esife');
}
