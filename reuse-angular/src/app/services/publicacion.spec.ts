import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PublicacionService } from './publicacion';
import { PublicacionNueva } from '../models/modelos';

describe('PublicacionService', () => {
  let service: PublicacionService;
  let http: HttpTestingController;
  const url = 'http://localhost:3000/api/publicaciones';

  const nueva: PublicacionNueva = {
    titulo: 'Libro de Física', descripcion: 'Libro en buen estado', categoria: 'Libros', modalidad: 'DONACION'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PublicacionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getPublicaciones hace GET con los filtros como parámetros', () => {
    service.getPublicaciones({ estado: 'DISPONIBLE', categoria: 'Libros' }).subscribe();
    const req = http.expectOne(r => r.url === url);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('estado')).toBe('DISPONIBLE');
    expect(req.request.params.get('categoria')).toBe('Libros');
    expect(req.request.params.has('modalidad')).toBe(false);
    req.flush([]);
  });

  it('createPublicacion hace POST con los datos', () => {
    service.createPublicacion(nueva).subscribe();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nueva);
    req.flush({});
  });

  it('updatePublicacion hace PUT al id indicado', () => {
    service.updatePublicacion(7, nueva).subscribe();
    const req = http.expectOne(`${url}/7`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('cancelarPublicacion hace DELETE al id indicado', () => {
    service.cancelarPublicacion(7).subscribe();
    const req = http.expectOne(`${url}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ mensaje: 'ok' });
  });

  it('getSolicitudesDe consulta las solicitudes de la publicación', () => {
    service.getSolicitudesDe(7).subscribe();
    const req = http.expectOne(`${url}/7/solicitudes`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});