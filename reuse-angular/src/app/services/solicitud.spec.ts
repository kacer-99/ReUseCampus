import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SolicitudService } from './solicitud';
import { EntregaService } from './entrega';

describe('SolicitudService y EntregaService', () => {
  let solicitudes: SolicitudService;
  let entregas: EntregaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    solicitudes = TestBed.inject(SolicitudService);
    entregas = TestBed.inject(EntregaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('createSolicitud envía la publicación y el mensaje', () => {
    solicitudes.createSolicitud(3, 'Me sirve para el ramo').subscribe();
    const req = http.expectOne('http://localhost:3000/api/solicitudes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ publicacionId: 3, mensaje: 'Me sirve para el ramo' });
    req.flush({});
  });

  it('aceptar hace PUT a /aceptar', () => {
    solicitudes.aceptar(5).subscribe();
    const req = http.expectOne('http://localhost:3000/api/solicitudes/5/aceptar');
    expect(req.request.method).toBe('PUT');
    req.flush({ mensaje: 'ok' });
  });

  it('cancelar hace PUT a /cancelar', () => {
    solicitudes.cancelar(5).subscribe();
    const req = http.expectOne('http://localhost:3000/api/solicitudes/5/cancelar');
    expect(req.request.method).toBe('PUT');
    req.flush({ mensaje: 'ok' });
  });

  it('confirmar una entrega hace PUT a /confirmar', () => {
    entregas.confirmar(9).subscribe();
    const req = http.expectOne('http://localhost:3000/api/entregas/9/confirmar');
    expect(req.request.method).toBe('PUT');
    req.flush({ mensaje: 'ok' });
  });
});