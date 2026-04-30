import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { PagosService } from './pagoService';


@Component({
  selector: 'app-pago',
  imports: [CommonModule, FormsModule],
  templateUrl: './pago.html',
  styleUrl: './pago.css',
})
export class PagoComponent implements OnInit {
  @ViewChild('cardElement') cardElementRef!: ElementRef;

  tokenReservaEntrada: string = '';
  tokenUsuario: string = '';
  idEspectaculo: string = '';
  artista: string = '';

  // Estados y valores
  estado: 'PREPARANDO' | 'ESPERANDO_PAGO' | 'PROCESANDO' | 'EXITOSO' | 'ERROR' = 'PREPARANDO';
  clientSecret: string = '';
  paymentIntentId: string = '';
  mensaje: string = '';
  error: string = '';
  monto: number = 0;

  // Stripe
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  cardElement: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pagosService: PagosService
  ) {}

  async ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      this.tokenReservaEntrada = params['tokenReservaEntrada'];
      this.idEspectaculo = params['idEspectaculo'];
      this.artista = params['artista'];

      this.tokenUsuario = localStorage.getItem('tokenUsuario') || '';

      if (!this.tokenReservaEntrada || !this.tokenUsuario) {
        this.error = 'Datos de sesión inválidos. Por favor, intenta de nuevo.';
        this.estado = 'ERROR';
        return;
      }

      // Inicializar Stripe
      await this.inicializarStripe();
      
      // Preparar el pago
      this.prepararPago();
    });
  }

  async inicializarStripe() {
    // ⚠️ Reemplazar con tu public key de Stripe
    this.stripe = await loadStripe('pk_test_YOUR_PUBLIC_KEY');
    if (!this.stripe) {
      this.error = 'Error al cargar Stripe. Intenta de nuevo.';
      this.estado = 'ERROR';
      return;
    }
    this.elements = this.stripe.elements();
    this.cardElement = this.elements.create('card');
    
    // Montar el elemento de tarjeta
    if (this.cardElementRef && this.cardElementRef.nativeElement) {
      this.cardElement.mount(this.cardElementRef.nativeElement);
    }
  }

  prepararPago() {
    this.estado = 'PREPARANDO';
    this.mensaje = 'Preparando el pago...';

    this.pagosService.prepararPago({
      tokenReservaEntrada: this.tokenReservaEntrada
    }).subscribe({
      next: (response: any) => {
        this.clientSecret = response.clientSecret;
        this.estado = 'ESPERANDO_PAGO';
        this.mensaje = 'Ingresa los datos de tu tarjeta para completar el pago.';
        // Extraer monto del clientSecret si es posible (ver con backend)
      },
      error: (error: any) => {
        this.error = error.error?.error || 'Error al preparar el pago.';
        this.estado = 'ERROR';
        console.error(error);
      }
    });
  }

  async confirmarPago() {
    if (!this.stripe || !this.cardElement) {
      this.error = 'Stripe no está inicializado.';
      return;
    }

    this.estado = 'PROCESANDO';
    this.mensaje = 'Procesando tu pago...';

    try {
      const { setupIntent, error } = await this.stripe.confirmCardPayment(
        this.clientSecret,
        {
          payment_method: {
            card: this.cardElement,
            billing_details: {}
          }
        }
      ) as any;

      if (error) {
        this.error = error.message;
        this.estado = 'ERROR';
        return;
      }

      // ✓ Pago confirmado por Stripe
      this.paymentIntentId = setupIntent?.id || '';
      this.estado = 'EXITOSO';
      this.mensaje = '✓ ¡Pago confirmado! Tu compra ha sido procesada.';

      // Esperar un poco y mostrar confirmación final
      setTimeout(() => {
        this.router.navigate(['/espectaculos']);
      }, 3000);

    } catch (err: any) {
      this.error = 'Error al procesar el pago: ' + err.message;
      this.estado = 'ERROR';
    }
  }

  volver() {
    this.router.navigate(['/espectaculos']);
  }
}