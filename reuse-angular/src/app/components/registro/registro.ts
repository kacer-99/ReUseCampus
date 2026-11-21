import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { mensajeError } from '../../utilidades/errores';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html'
})
export class RegistroComponent {
  error = '';
  enviando = false;

  formulario = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    correo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  registrar(): void {
    this.error = '';
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando = true;
    const { nombre, correo, password } = this.formulario.getRawValue();
    this.auth.registro(nombre, correo, password).subscribe({
      next: () => this.router.navigate(['/publicaciones']),
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible crear la cuenta.');
        this.enviando = false;
        this.cdr.detectChanges();
      }
    });
  }
}