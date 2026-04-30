import { Routes } from '@angular/router';
import { CompraComponent } from './compra/compra.component';
import { EspectaculosComponent } from './espectaculos/espectaculos.component';
import { LoginComponent } from './login/login.component';
import { ColaComponent } from './cola/cola.component';
import { PagoComponent } from './pago/pago';  // ✓ AGREGADO
import { Recuperar } from './recuperar/recuperar.component';
import { ResetPassword } from './reset-password/reset-password.component';

export const routes: Routes = [
    { path: '', component: EspectaculosComponent }, // Para que al abrir la web salga algo
    { path: 'espectaculos', component: EspectaculosComponent },
    { path: 'comprar', component: CompraComponent },
    { path: 'login', component: LoginComponent },
    { path: 'pago', component: PagoComponent },  // ✓ AGREGADO
    { path: 'cola', component: ColaComponent },
    { path: 'recuperar', component: Recuperar },
    { path: 'reset-password', component: ResetPassword }
];