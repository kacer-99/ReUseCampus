import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Entrega } from '../../models/modelos';
import { AuthService } from '../../services/auth';
import { EntregaService } from '../../services/entrega';
import { mensajeError } from '../../utilidades/errores';

@Component({
  selector: 'app-entregas',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './entregas.html'
})
export class EntregasComponent implements OnInit {
  entregas: Entrega[] = [];
  cargando = true;
  error = '';
  exito = '';

  constructor(
    public auth: AuthService,
    private entregaService: EntregaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.entregaService.getMisEntregas().subscribe({
      next: (datos) => {
        this.entregas = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible obtener sus entregas.');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Solo el propietario confirma la entrega
  puedeConfirmar(entrega: Entrega): boolean {
    return entrega.estado === 'PENDIENTE' && entrega.propietarioId === this.auth.usuario()?.id;
  }

  confirmar(entrega: Entrega): void {
    if (!confirm('¿Confirma que ya entregó este artículo?')) return;

    this.error = '';
    this.exito = '';
    this.entregaService.confirmar(entrega.id).subscribe({
      next: (respuesta) => {
        this.exito = respuesta.mensaje;
        this.cargar();
      },
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible confirmar la entrega.');
        this.cdr.detectChanges();
      }
    });
  }

  clase(valor: string): string {
    return valor.toLowerCase().replace(/\s+/g, '-');
  }
}