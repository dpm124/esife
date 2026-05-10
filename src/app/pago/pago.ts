import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { firstValueFrom } from 'rxjs';
import { PagosService } from './pagoService';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './pago.html',
  styleUrl: './pago.css',
})
export class PagoComponent implements OnInit {
  @ViewChild('cardNumberElement') cardNumberElementRef!: ElementRef;
  @ViewChild('cardExpiryElement') cardExpiryElementRef!: ElementRef;
  @ViewChild('cardCvcElement') cardCvcElementRef!: ElementRef;
  // ELIMINADO EL @ViewChild DEL CÓDIGO POSTAL

  tokenReservaEntrada: string = '';
  tokenUsuario: string = '';
  idEspectaculo: string = '';
  artista: string = '';
  codigoPostal: string = '';

  estado: 'PREPARANDO' | 'ESPERANDO_PAGO' | 'PROCESANDO' | 'EXITOSO' | 'ERROR' = 'PREPARANDO';
  clientSecret: string = '';
  paymentIntentId: string = '';
  mensaje: string = '';
  error: string = '';

  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  cardNumberElement: any = null;
  cardExpiryElement: any = null;
  cardCvcElement: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pagosService: PagosService,
    @Inject(PLATFORM_ID) private platformId: object,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    console.log("🚀 0. Componente Pago cargado. Leyendo URL...");
    
    this.route.queryParams.subscribe(params => {
      this.tokenReservaEntrada = params['tokenReservaEntrada'];
      this.idEspectaculo = params['idEspectaculo'];
      this.artista = params['artista'];

      console.log("🎫 Token Reserva URL:", this.tokenReservaEntrada);

      this.tokenUsuario = isPlatformBrowser(this.platformId)
        ? localStorage.getItem('tokenUsuario') || ''
        : '';

      console.log("👤 Token Usuario LocalStorage:", this.tokenUsuario ? "Sí hay token" : "VACÍO (¡Peligro!)");

      if (!this.tokenReservaEntrada || !this.tokenUsuario) {
        console.error("❌ Abortando: Faltan tokens de sesión o reserva. ¿Has iniciado sesión?");
        this.error = 'Datos de sesión inválidos. Por favor, intenta de nuevo.';
        this.estado = 'ERROR';
        this.cdr.detectChanges(); 
        return;
      }

      console.log("✅ Datos correctos. Llamando a iniciarProcesoDePago()...");
      this.iniciarProcesoDePago();
    });
  }

  async iniciarProcesoDePago() {
    console.log("🔍 1. Iniciando proceso de pago...");
    this.estado = 'PREPARANDO';
    this.mensaje = 'Conectando con el servidor...';
    this.cdr.detectChanges(); 

    try {
      console.log("🔍 2. Llamando a los servidores de Stripe...");
      this.stripe = await loadStripe('pk_test_51T4NTPRo7zC5hz4eg3j9DeRgudNHYbl06btCtz6xsFlgYdCCf7EUFqTDV8kOwDh97RL2sjZRCZvlAHnzzOLX3zOM00pezZcmXy');
      
      if (!this.stripe) {
        console.error("❌ ERROR: loadStripe devolvió null.");
        this.error = 'Error al cargar Stripe.';
        this.estado = 'ERROR';
        this.cdr.detectChanges();
        return;
      }
      console.log("🔍 3. Stripe cargado con éxito. Creando formulario...");

      this.elements = this.stripe.elements();
      this.cardNumberElement = this.elements.create('cardNumber', { iconStyle: 'solid' });
      this.cardExpiryElement = this.elements.create('cardExpiry');
      this.cardCvcElement = this.elements.create('cardCvc');
      
      console.log("🔍 4. Formulario creado. Lanzando petición a Spring Boot (/prepararPago)...");

      this.pagosService.prepararPago({ tokenReservaEntrada: this.tokenReservaEntrada })
        .subscribe({
          next: (response: any) => {
            console.log("🔍 5. ¡Spring Boot ha respondido con éxito!", response);
            this.clientSecret = response.clientSecret || response.client_secret || (typeof response === 'string' ? response : null);

            if (!this.clientSecret) {
              this.error = 'El servidor respondió, pero no envió el código de pago (clientSecret).';
              this.estado = 'ERROR';
              this.cdr.detectChanges();
              return;
            }

            this.estado = 'ESPERANDO_PAGO';
            this.mensaje = 'Ingresa los datos de tu tarjeta.';
            this.cdr.detectChanges(); 
            
            if (this.cardNumberElementRef?.nativeElement) this.cardNumberElement.mount(this.cardNumberElementRef.nativeElement);
            if (this.cardExpiryElementRef?.nativeElement) this.cardExpiryElement.mount(this.cardExpiryElementRef.nativeElement);
            if (this.cardCvcElementRef?.nativeElement) this.cardCvcElement.mount(this.cardCvcElementRef.nativeElement);
          },
          error: (error: any) => {
            console.error("❌ 5. ¡Spring Boot ha devuelto un error!", error);
            if (error?.status === 401) {
              this.error = 'Tu sesión ha caducado antes de iniciar el pago.';
            } else if (error?.status === 404) {
              this.error = 'No se encontró la reserva para preparar el pago.';
            } else {
              this.error = error.error?.error || 'No se pudo conectar con el servidor Spring Boot.';
            }
            this.estado = 'ERROR';
            this.cdr.detectChanges();
          }
        });

    } catch (err) {
      console.error("❌ ERROR GRAVE (Crash):", err);
      this.error = 'Fallo crítico al iniciar el pago.';
      this.estado = 'ERROR';
      this.cdr.detectChanges();
    }
  }

  async confirmarPago() {
    if (!this.stripe || !this.cardNumberElement) return;

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
      // 1. Cobrar en Stripe
      const { paymentIntent, error } = await this.stripe.confirmCardPayment(
        this.clientSecret,
        { payment_method: { card: this.cardNumberElement } }
      );

      if (error) {
        this.error = error.message || 'Error desconocido al procesar el pago.';
        this.estado = 'ERROR';
        this.cdr.detectChanges();
        return;
      }

      if (!paymentIntent?.id) {
        this.error = 'No se pudo obtener el ID del pago confirmado.';
        this.estado = 'ERROR';
        this.cdr.detectChanges();
        return;
      }

      // 2. Avisar a Spring Boot (UNA SOLA VEZ)
      try {
        const resultado = await firstValueFrom(
          this.pagosService.confirmarPago({
            paymentIntentId: paymentIntent.id,
            tokenUsuario: this.tokenUsuario,
          })
        );

        if ((resultado as any)?.error) {
          this.error = (resultado as any).error;
          this.estado = 'ERROR';
          this.cdr.detectChanges();
          return;
        }

        // 3. Todo salió perfecto
        this.estado = 'EXITOSO';
        this.mensaje = '✓ ¡Entrada confirmada! Te hemos enviado un email.';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/espectaculos']), 3000);

      } catch (confirmError: any) {
        if (confirmError instanceof HttpErrorResponse) {
          if (confirmError.status === 401) {
            this.error = 'Tu sesión ha caducado antes de terminar la compra. Vuelve a iniciar sesión y repite la reserva.';
          } else if (confirmError.status === 404) {
            this.error = 'No se encontró la reserva o el token de compra ya no es válido.';
          } else if (typeof confirmError.error === 'string' && confirmError.error.trim()) {
            this.error = confirmError.error;
          } else {
            this.error = 'No se pudo confirmar la compra en el servidor.';
          }
        } else {
          this.error = 'No se pudo confirmar la compra en el servidor.';
        }

        this.estado = 'ERROR';
        this.cdr.detectChanges();
      }

    } catch (err: any) {
      this.error = 'Error de conexión con Stripe: ' + err.message;
      this.estado = 'ERROR';
      this.cdr.detectChanges();
    }
  }

  // EL CANDADO PARA EL CÓDIGO POSTAL
  validarCP(event: any) {
    let valor = event.target.value.replace(/[^0-9]/g, '');
    if (valor.length > 5) {
      valor = valor.substring(0, 5);
    }
    this.codigoPostal = valor;
    event.target.value = valor;
  }

  volver() {
    this.router.navigate(['/espectaculos']);
  }
}