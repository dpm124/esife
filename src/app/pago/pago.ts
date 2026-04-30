import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { PagosService } from './pagoService';

@Component({
  selector: 'app-pago',
  standalone: true, // Si usas Angular 17+ suele ser standalone, si te da error quita esta línea y asegúrate de declararlo en tu módulo
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './pago.html',
  styleUrl: './pago.css',
})
export class PagoComponent implements OnInit {
  @ViewChild('cardElement') cardElementRef!: ElementRef;

  tokenReservaEntrada: string = '';
  tokenUsuario: string = '';
  idEspectaculo: string = '';
  artista: string = '';

  estado: 'PREPARANDO' | 'ESPERANDO_PAGO' | 'PROCESANDO' | 'EXITOSO' | 'ERROR' = 'PREPARANDO';
  clientSecret: string = '';
  paymentIntentId: string = '';
  mensaje: string = '';
  error: string = '';

  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  cardElement: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pagosService: PagosService,
    @Inject(PLATFORM_ID) private platformId: object,
    private cdr: ChangeDetectorRef // ✓ AÑADIDO: Para obligar a Angular a refrescar la pantalla
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.tokenReservaEntrada = params['tokenReservaEntrada'];
      this.idEspectaculo = params['idEspectaculo'];
      this.artista = params['artista'];

      this.tokenUsuario = isPlatformBrowser(this.platformId)
        ? localStorage.getItem('tokenUsuario') || ''
        : '';

      if (!this.tokenReservaEntrada || !this.tokenUsuario) {
        this.error = 'Datos de sesión inválidos. Por favor, intenta de nuevo.';
        this.estado = 'ERROR';
        this.cdr.detectChanges(); // Forzamos actualización
        return;
      }

      // Separamos la lógica asíncrona para no confundir a Angular
      this.iniciarProcesoDePago();
    });
  }

  async iniciarProcesoDePago() {
    // 1. Mostrar estado de carga correctamente
    this.estado = 'PREPARANDO';
    this.mensaje = 'Conectando con el servidor...';
    this.cdr.detectChanges(); // Forzamos actualización visual

    // 2. Inicializar Stripe "en la sombra"
    this.stripe = await loadStripe('pk_test_51T4NTPRo7zC5hz4eg3j9DeRgudNHYbl06btCtz6xsFlgYdCCf7EUFqTDV8kOwDh97RL2sjZRCZvlAHnzzOLX3zOM00pezZcmXy');
    if (!this.stripe) {
      this.error = 'Error al cargar Stripe.';
      this.estado = 'ERROR';
      this.cdr.detectChanges();
      return;
    }
    this.elements = this.stripe.elements();
    this.cardElement = this.elements.create('card');

    // 3. Pedir el ClientSecret al Backend
    this.pagosService.prepararPago({ tokenReservaEntrada: this.tokenReservaEntrada })
      .subscribe({
        next: (response: any) => {
          // CHIVATO PARA EL SENIOR: Vamos a ver qué devuelve exactamente el backend
          console.log("Respuesta real del backend:", response);

          // Extraemos el token sea cual sea el formato que use Spring Boot
          this.clientSecret = response.clientSecret || response.client_secret || (typeof response === 'string' ? response : null);

          // Si seguimos sin token, cortamos el flujo y avisamos
          if (!this.clientSecret) {
            this.error = 'El servidor respondió, pero no envió el código de pago (clientSecret).';
            this.estado = 'ERROR';
            this.cdr.detectChanges();
            return;
          }

          this.estado = 'ESPERANDO_PAGO';
          this.mensaje = 'Ingresa los datos de tu tarjeta.';
          this.cdr.detectChanges(); 

          if (this.cardElementRef && this.cardElementRef.nativeElement) {
            this.cardElement.mount(this.cardElementRef.nativeElement);
          }
        },
        error: (error: any) => {
          this.error = error.error?.error || 'No se pudo conectar con el servidor Spring Boot.';
          this.estado = 'ERROR';
          this.cdr.detectChanges();
        }
      });
  }

  async confirmarPago() {
    if (!this.stripe || !this.cardElement) return;


    // ✓ NUEVO: Evitamos llamar a Stripe si no tenemos el secreto del backend
    if (!this.clientSecret) {
      this.error = 'Error interno: Falta el clientSecret. Revisa la consola (F12).';
      this.estado = 'ERROR';
      this.cdr.detectChanges();
      return;
    }
    
    this.estado = 'PROCESANDO';
    this.mensaje = 'Procesando tu pago...';
    this.cdr.detectChanges();

    try {
      const { paymentIntent, error } = await this.stripe.confirmCardPayment(
        this.clientSecret,
        { payment_method: { card: this.cardElement } }
      );

      if (error) {
        this.error = error.message || 'Error desconocido al procesar el pago.';
        this.estado = 'ERROR';
        this.cdr.detectChanges();
        return;
      }

      this.estado = 'EXITOSO';
      this.mensaje = '✓ ¡Pago exitoso! El servidor está confirmando tus entradas...';
      this.cdr.detectChanges();

      setTimeout(() => {
        this.router.navigate(['/espectaculos']);
      }, 4000);

    } catch (err: any) {
      this.error = 'Error de conexión con Stripe: ' + err.message;
      this.estado = 'ERROR';
      this.cdr.detectChanges();
    }
  }

  volver() {
    this.router.navigate(['/espectaculos']);
  }
}