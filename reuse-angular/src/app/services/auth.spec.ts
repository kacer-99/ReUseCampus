import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const url = 'http://localhost:3000/api/auth';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: 'login', children: [] }])]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('login hace POST y guarda el token y el usuario', () => {
    service.login('ana@reuse.cl', 'Clave123').subscribe();
    const req = http.expectOne(`${url}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ correo: 'ana@reuse.cl', password: 'Clave123' });
    req.flush({ token: 'abc', usuario: { id: 2, nombre: 'Ana', correo: 'ana@reuse.cl', rol: 'USUARIO' } });

    expect(service.token()).toBe('abc');
    expect(service.usuario()?.nombre).toBe('Ana');
    expect(service.estaAutenticado()).toBe(true);
    expect(service.esAdministrador()).toBe(false);
  });

  it('logout elimina la sesión', () => {
    service.login('admin@reuse.cl', 'Admin123').subscribe();
    http.expectOne(`${url}/login`).flush({
      token: 'xyz', usuario: { id: 1, nombre: 'Admin', correo: 'admin@reuse.cl', rol: 'ADMINISTRADOR' }
    });
    expect(service.esAdministrador()).toBe(true);

    service.logout();
    expect(service.token()).toBeNull();
    expect(service.usuario()).toBeNull();
    expect(service.estaAutenticado()).toBe(false);
  });
});