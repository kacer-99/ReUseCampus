import { Routes } from '@angular/router';
import { autenticadoGuard } from './guards/auth-guard';
import { LoginComponent } from './components/login/login';
import { RegistroComponent } from './components/registro/registro';
import { PublicacionesComponent } from './components/publicaciones/publicaciones';

export const routes: Routes = [
  { path: '', redirectTo: 'publicaciones', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'publicaciones', component: PublicacionesComponent, canActivate: [autenticadoGuard] },
  { path: '**', redirectTo: 'publicaciones' }
];