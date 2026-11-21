import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CATEGORIAS, ESTADOS_PUBLICACION, MODALIDADES, Publicacion } from '../../models/modelos';
import { PublicacionService } from '../../services/publicacion';
import { mensajeError } from '../../utilidades/errores';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [RouterLink, DatePipe, ReactiveFormsModule],
  templateUrl: './publicaciones.html'
})
export class PublicacionesComponent implements OnInit {
  publicaciones: Publicacion[] = [];
  cargando = true;
  error = '';

  categorias = CATEGORIAS;
  modalidades = MODALIDADES;
  estados = ESTADOS_PUBLICACION;

  filtros = new FormGroup({
    estado: new FormControl('', { nonNullable: true }),
    categoria: new FormControl('', { nonNullable: true }),
    modalidad: new FormControl('', { nonNullable: true })
  });

  constructor(
    private publicacionService: PublicacionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.publicacionService.getPublicaciones(this.filtros.getRawValue()).subscribe({
      next: (datos) => {
        this.publicaciones = datos;
        this.cargando = false;
        this.cdr.detectChanges(); // la app es zoneless: se avisa a Angular que redibuje
      },
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible obtener las publicaciones.');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros.reset({ estado: '', categoria: '', modalidad: '' });
    this.cargar();
  }

  // "DISPONIBLE" -> "disponible": se usa como clase CSS para el color del distintivo
  clase(valor: string): string {
    return valor.toLowerCase().replace(/\s+/g, '-');
  }
}