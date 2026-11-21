import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login';

describe('LoginComponent', () => {
  let http: HttpTestingController;
  let componente: LoginComponent;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    http = TestBed.inject(HttpTestingController);
    componente = TestBed.createComponent(LoginComponent).componentInstance;
  });

  afterEach(() => http.verify());

  it('no llama a la API si el formulario es inválido', () => {
    componente.ingresar();
    http.expectNone('http://localhost:3000/api/auth/login');
    expect(componente.formulario.invalid).toBe(true);
  });

  it('muestra el mensaje de la API cuando las credenciales son incorrectas', () => {
    componente.formulario.setValue({ correo: 'ana@reuse.cl', password: 'mala' });
    componente.ingresar();
    http.expectOne('http://localhost:3000/api/auth/login')
      .flush({ mensaje: 'Correo o contraseña incorrectos' }, { status: 401, statusText: 'Unauthorized' });
    expect(componente.error).toBe('Correo o contraseña incorrectos');
  });
});