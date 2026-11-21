import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Solicitud } from '../../models/modelos';
import { SolicitudService } from '../../services/solicitud';
import { mensajeError } from '../../utilidades/errores';

@Component({
  selector: 'app-mis-solicitudes',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './mis-solicitudes.html'
})
export class MisSolicitudesComponent implements OnInit {
  solicitudes: Solicitud[] = [];
  cargando = true;
  error = '';
  exito = '';

  constructor(
    private solicitudService: SolicitudService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.solicitudService.getMisSolicitudes().subscribe({
      next: (datos) => {
        this.solicitudes = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible obtener sus solicitudes.');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // RN16: solo se puede cancelar mientras la solicitud está PENDIENTE
  cancelar(solicitud: Solicitud): void {
    if (!confirm('¿Desea cancelar esta solicitud?')) return;

    this.error = '';
    this.exito = '';
    this.solicitudService.cancelar(solicitud.id).subscribe({
      next: (respuesta) => {
        this.exito = respuesta.mensaje;
        this.cargar();
      },
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible cancelar la solicitud.');
        this.cdr.detectChanges();
      }
    });
  }

  clase(valor: string): string {
    return valor.toLowerCase().replace(/\s+/g, '-');
  }
}