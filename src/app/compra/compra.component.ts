import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { loadStripe } from '@stripe/stripe-js'; // Añadimos esto
import { EspectaculosService } from '../espectaculos/espectaculos.service';
import { Pagos } from './pagos';


@Component({
  selector: 'app-compra',
  templateUrl: './compra.html',
  styleUrl: './compra.css',
})
export class CompraComponent implements OnInit {
  idEspectaculo: string | null = null;
  artista: string | null = null;
  stripe: any; // Para Stripe
  card: any;   // Para el cuadro de la tarjeta

  importe : number = 20.00;

  // Añadimos el servicio al constructor para que 'pagar()' funcione
  constructor(
    private service: Pagos,
    private route: ActivatedRoute, 
    private router: Router,
    private espectaculosService: EspectaculosService 
  ) {}

  async ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.idEspectaculo = params['idEspectaculo'];
      this.artista = params['artista'];
    });

    // ESTO ES LO QUE HACE QUE APAREZCA EL CUADRO
    this.stripe = await loadStripe('pk_test_51T92mIK3cuk74EClzLWy8LJUvDJSRqhi6KcQ13Nqg5pRICG0MtXWISuyjv8Q8N70xej347QnCn0d1FM8KkF01A2D00hL4xCWHG');
    const elements = this.stripe.elements();
    this.card = elements.create('card');
    this.card.mount('#card-element'); 
  }

  volver() {
    this.router.navigate(['/espectaculos']);
  }

  irAlPago() {
    let infoPago = {
      centimos : Math.floor(this.importe.valueOf() * 100), // Stripe trabaja con centavos
    };
    this.service.prepararPago(infoPago).subscribe({
      next: (response) => {
        console.log('Respuesta del backend', response)
      },
      error: (error) => {
        console.log('Error:', error)
      }
    });
  }

  showForm() { 
    let elements = this.stripe.elements() 
    let style = { 
      base: { 
      color: "#32325d", fontFamily: 'Arial, sans-serif', 
      fontSmoothing: "antialiased", fontSize: "16px", 
      "::placeholder": { 
      color: "#32325d" 
      } 
    },
  }
}
}