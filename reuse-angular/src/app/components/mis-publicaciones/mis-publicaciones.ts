import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Publicacion } from '../../models/modelos';
import { PublicacionService } from '../../services/publicacion';
import { mensajeError } from '../../utilidades/errores';

@Component({
  selector: 'app-mis-publicaciones',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './mis-publicaciones.html'
})
export class MisPublicacionesComponent implements OnInit {
  publicaciones: Publicacion[] = [];
  cargando = true;
  error = '';
  exito = '';

  constructor(
    private publicacionService: PublicacionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.publicacionService.getMisPublicaciones().subscribe({
      next: (datos) => {
        this.publicaciones = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible obtener sus publicaciones.');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelar(publicacion: Publicacion): void {
    if (!confirm('¿Desea cancelar esta publicación?')) return;

    this.error = '';
    this.exito = '';
    this.publicacionService.cancelarPublicacion(publicacion.id).subscribe({
      next: (respuesta) => {
        this.exito = respuesta.mensaje;
        this.cargar();
      },
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible cancelar la publicación.');
        this.cdr.detectChanges();
      }
    });
  }

  clase(valor: string): string {
    return valor.toLowerCase().replace(/\s+/g, '-');
  }
}