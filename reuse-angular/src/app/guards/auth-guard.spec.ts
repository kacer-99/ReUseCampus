import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { administradorGuard, autenticadoGuard } from './auth-guard';
import { AuthService } from '../services/auth';

describe('Guards de rutas', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  const ejecutar = (guard: typeof autenticadoGuard) =>
    TestBed.runInInjectionContext(() => guard({} as never, {} as never));

  it('autenticadoGuard redirige a /login si no hay sesión', () => {
    const resultado = ejecutar(autenticadoGuard) as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/login');
  });

  it('autenticadoGuard permite entrar con sesión', () => {
    localStorage.setItem('token', 'abc');
    auth.usuario.set({ id: 2, nombre: 'Ana', correo: 'ana@reuse.cl', rol: 'USUARIO' });
    expect(ejecutar(autenticadoGuard)).toBe(true);
  });

  it('administradorGuard bloquea a un usuario común', () => {
    auth.usuario.set({ id: 2, nombre: 'Ana', correo: 'ana@reuse.cl', rol: 'USUARIO' });
    const resultado = ejecutar(administradorGuard) as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/publicaciones');
  });

  it('administradorGuard permite al administrador', () => {
    auth.usuario.set({ id: 1, nombre: 'Admin', correo: 'admin@reuse.cl', rol: 'ADMINISTRADOR' });
    expect(ejecutar(administradorGuard)).toBe(true);
  });
});