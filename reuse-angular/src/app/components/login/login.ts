import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { mensajeError } from '../../utilidades/errores';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html'
})
export class LoginComponent {
  error = '';
  enviando = false;

  formulario = new FormGroup({
    correo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ingresar(): void {
    this.error = '';
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando = true;
    const { correo, password } = this.formulario.getRawValue();
    this.auth.login(correo, password).subscribe({
      next: () => this.router.navigate(['/publicaciones']),
      error: (error) => {
        console.error(error);
        this.error = mensajeError(error, 'No fue posible iniciar sesión.');
        this.enviando = false;
        this.cdr.detectChanges();
      }
    });
  }
}