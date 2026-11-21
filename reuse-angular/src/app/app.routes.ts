import { Routes } from '@angular/router';
import { autenticadoGuard } from './guards/auth-guard';
import { LoginComponent } from './components/login/login';
import { RegistroComponent } from './components/registro/registro';
import { PublicacionesComponent } from './components/publicaciones/publicaciones';
import { PublicacionFormularioComponent } from './components/publicacion-formulario/publicacion-formulario';
import { PublicacionDetalleComponent } from './components/publicacion-detalle/publicacion-detalle';
import { MisPublicacionesComponent } from './components/mis-publicaciones/mis-publicaciones';
import { MisSolicitudesComponent } from './components/mis-solicitudes/mis-solicitudes';
import { EntregasComponent } from './components/entregas/entregas';

export const routes: Routes = [
  { path: '', redirectTo: 'publicaciones', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'publicaciones', component: PublicacionesComponent, canActivate: [autenticadoGuard] },
  // "nueva" y "editar/:id" van antes de ":id" para que no se confundan con un id
  { path: 'publicaciones/nueva', component: PublicacionFormularioComponent, canActivate: [autenticadoGuard] },
  { path: 'publicaciones/editar/:id', component: PublicacionFormularioComponent, canActivate: [autenticadoGuard] },
  { path: 'publicaciones/:id', component: PublicacionDetalleComponent, canActivate: [autenticadoGuard] },
  { path: 'mis-publicaciones', component: MisPublicacionesComponent, canActivate: [autenticadoGuard] },
  { path: 'mis-solicitudes', component: MisSolicitudesComponent, canActivate: [autenticadoGuard] },
  { path: 'entregas', component: EntregasComponent, canActivate: [autenticadoGuard] },
  { path: '**', redirectTo: 'publicaciones' }
];