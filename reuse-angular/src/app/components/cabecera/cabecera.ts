import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-cabecera',
  standalone: true,
  templateUrl: './cabecera.html'
})
export class CabeceraComponent {
  constructor(public auth: AuthService) {}

  cerrarSesion(): void {
    this.auth.logout();
  }
}