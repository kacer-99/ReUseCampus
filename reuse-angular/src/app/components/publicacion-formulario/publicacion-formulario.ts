import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CATEGORIAS, MODALIDADES } from '../../models/modelos';
import { PublicacionService } from '../../services/publicacion';
import { mensajeError } from '../../utilidades/errores';

// Un solo formulario sirve para crear (/publicaciones/nueva) y para editar (/publicaciones/editar/:id)
@Component({
  selector: 'app-publicacion-formulario',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './publicacion-formulario.html'
})
export class PublicacionFormularioComponent implements OnInit {
  id: number | null = null;
  error = '';
  enviando = false;

  categorias = CATEGORIAS;
  modalidades = MODALIDADES;

  formulario = new FormGroup({
    titulo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(150)]
    }),
    categoria: new FormControl('Libros', { nonNullable: true, validators: [Validators.required] }),
    modalidad: new FormControl('DONACION', { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)]
    })
  });

  constructor(
    private publicacionService: PublicacionService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const parametro = this.route.snapshot.paramMap.get('id');
    if (parametro) {
      this.id = Number(parametro);
      this.publicacionService.getPublicacionById(this.id).subscribe({
        next: (publicacion) => {
          this.formulario.patchValue({
            titulo: publicacion.titulo,
            categoria: publicacion.categoria,
            modalidad: publicacion.modalidad,
            descripcion: publicacion.descripcion
          });
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(error);
          this.error = mensajeError(error, 'No fue posible cargar la publicación.');
          this.cdr.detectChanges();
        }
      });
    }
  }

  guardar(): void {
    this.error = '';
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando = true;
    const datos = this.formulario.getRawValue();
    const peticion = this.id
      ? this.publicacionService.updatePublicacion(this.id, datos)
      : this.publicacionService.createPublicacion(datos);

    peticion.subscribe({
      next: (publicacion) => this.router.navigate(['/publicaciones', publicacion.id]),
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible guardar la publicación.');
        this.enviando = false;
        this.cdr.detectChanges();
      }
    });
  }
}