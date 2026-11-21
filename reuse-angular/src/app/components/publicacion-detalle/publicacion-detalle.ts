import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Mensaje, Publicacion, Solicitud } from '../../models/modelos';
import { AuthService } from '../../services/auth';
import { PublicacionService } from '../../services/publicacion';
import { SolicitudService } from '../../services/solicitud';
import { mensajeError } from '../../utilidades/errores';

@Component({
  selector: 'app-publicacion-detalle',
  standalone: true,
  imports: [RouterLink, DatePipe, ReactiveFormsModule],
  templateUrl: './publicacion-detalle.html'
})
export class PublicacionDetalleComponent implements OnInit {
  id = 0;
  publicacion: Publicacion | null = null;
  solicitudes: Solicitud[] = [];
  cargando = true;
  error = '';
  exito = '';

  formulario = new FormGroup({
    mensaje: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] })
  });

  constructor(
    public auth: AuthService,
    private route: ActivatedRoute,
    private publicacionService: PublicacionService,
    private solicitudService: SolicitudService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();
  }

  // El usuario con sesión es el propietario de esta publicación
  get esPropietario(): boolean {
    return this.publicacion !== null && this.publicacion.usuarioId === this.auth.usuario()?.id;
  }

  // Solo se puede solicitar una publicación ajena y DISPONIBLE
  get puedeSolicitar(): boolean {
    return this.publicacion !== null && !this.esPropietario && this.publicacion.estado === 'DISPONIBLE';
  }

  get puedeCancelar(): boolean {
    return this.publicacion !== null && this.publicacion.estado === 'DISPONIBLE'
      && (this.esPropietario || this.auth.esAdministrador());
  }

  cargar(): void {
    this.cargando = true;
    this.publicacionService.getPublicacionById(this.id).subscribe({
      next: (publicacion) => {
        this.publicacion = publicacion;
        this.cargando = false;
        if (this.esPropietario || this.auth.esAdministrador()) {
          this.cargarSolicitudes();
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible cargar la publicación.');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarSolicitudes(): void {
    this.publicacionService.getSolicitudesDe(this.id).subscribe({
      next: (datos) => {
        this.solicitudes = datos;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible cargar las solicitudes.');
        this.cdr.detectChanges();
      }
    });
  }

  solicitar(): void {
    this.error = '';
    this.exito = '';
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.solicitudService.createSolicitud(this.id, this.formulario.getRawValue().mensaje).subscribe({
      next: () => {
        this.exito = 'Solicitud enviada. El propietario la revisará.';
        this.formulario.reset();
        this.cargar();
      },
      error: (error) => this.mostrarError(error, 'No fue posible enviar la solicitud.')
    });
  }

  aceptar(solicitud: Solicitud): void {
    this.ejecutar(this.solicitudService.aceptar(solicitud.id), 'No fue posible aceptar la solicitud.');
  }

  rechazar(solicitud: Solicitud): void {
    this.ejecutar(this.solicitudService.rechazar(solicitud.id), 'No fue posible rechazar la solicitud.');
  }

  cancelarPublicacion(): void {
    if (!confirm('¿Desea cancelar esta publicación? Sus solicitudes pendientes serán rechazadas.')) return;
    this.ejecutar(this.publicacionService.cancelarPublicacion(this.id), 'No fue posible cancelar la publicación.');
  }

  // Ejecuta una acción, muestra el mensaje de la API y recarga la pantalla
  private ejecutar(accion: Observable<Mensaje>, mensajeFallo: string): void {
    this.error = '';
    this.exito = '';
    accion.subscribe({
      next: (respuesta) => {
        this.exito = respuesta.mensaje;
        this.cargar();
      },
      error: (error) => this.mostrarError(error, mensajeFallo)
    });
  }

  private mostrarError(error: unknown, porDefecto: string): void {
    console.error(error);
    this.error = mensajeError(error, porDefecto);
    this.cdr.detectChanges();
  }

  clase(valor: string): string {
    return valor.toLowerCase().replace(/\s+/g, '-');
  }
}