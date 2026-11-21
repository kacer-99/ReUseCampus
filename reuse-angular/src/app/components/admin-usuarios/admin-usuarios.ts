import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Usuario } from '../../models/modelos';
import { UsuarioService } from '../../services/usuario';
import { mensajeError } from '../../utilidades/errores';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-usuarios.html'
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  cargando = true;
  error = '';
  exito = '';
  editandoId: number | null = null;

  formulario = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    correo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true }),
    rol: new FormControl('USUARIO', { nonNullable: true }),
    estado: new FormControl('ACTIVO', { nonNullable: true })
  });

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.usuarioService.getUsuarios().subscribe({
      next: (datos) => {
        this.usuarios = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible obtener los usuarios.');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  editar(usuario: Usuario): void {
    this.editandoId = usuario.id;
    this.exito = '';
    this.error = '';
    this.formulario.patchValue({
      nombre: usuario.nombre,
      correo: usuario.correo,
      password: '',
      rol: usuario.rol,
      estado: usuario.estado ?? 'ACTIVO'
    });
  }

  nuevo(): void {
    this.editandoId = null;
    this.formulario.reset({ nombre: '', correo: '', password: '', rol: 'USUARIO', estado: 'ACTIVO' });
  }

  guardar(): void {
    this.error = '';
    this.exito = '';
    const datos = this.formulario.getRawValue();

    // Al crear la contraseña es obligatoria; al editar es opcional
    if (this.formulario.invalid || (this.editandoId === null && datos.password.length < 6)) {
      this.formulario.markAllAsTouched();
      this.error = 'Revise los datos: nombre, correo válido y contraseña de al menos 6 caracteres al crear.';
      return;
    }

    if (this.editandoId === null) {
      this.usuarioService.createUsuario(datos).subscribe({
        next: () => this.terminarGuardado('Usuario creado correctamente.'),
        error: (error) => this.mostrarError(error)
      });
    } else {
      this.usuarioService.updateUsuario(this.editandoId, { ...datos, password: datos.password || undefined }).subscribe({
        next: () => this.terminarGuardado('Usuario actualizado correctamente.'),
        error: (error) => this.mostrarError(error)
      });
    }
  }

  private terminarGuardado(mensaje: string): void {
    this.exito = mensaje;
    this.nuevo();
    this.cargar();
  }

  private mostrarError(error: unknown): void {
    console.error(error);
    this.error = mensajeError(error, 'No fue posible guardar el usuario.');
    this.cdr.detectChanges();
  }

  desactivar(usuario: Usuario): void {
    if (!confirm(`¿Desea desactivar a ${usuario.nombre}?`)) return;

    this.error = '';
    this.exito = '';
    this.usuarioService.desactivarUsuario(usuario.id).subscribe({
      next: (respuesta) => {
        this.exito = respuesta.mensaje;
        this.cargar();
      },
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible desactivar el usuario.');
        this.cdr.detectChanges();
      }
    });
  }
}