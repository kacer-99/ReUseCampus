import { mensajeError } from './errores';

describe('mensajeError', () => {
  it('usa el mensaje que envía la API', () => {
    expect(mensajeError({ status: 409, error: { mensaje: 'Ya tiene una solicitud pendiente' } }))
      .toBe('Ya tiene una solicitud pendiente');
  });

  it('avisa cuando no hay comunicación con el servidor (status 0)', () => {
    expect(mensajeError({ status: 0 })).toContain('No hay comunicación con el servidor');
  });

  it('usa el mensaje por defecto cuando la API no entrega uno', () => {
    expect(mensajeError({ status: 500 }, 'Falló la operación')).toBe('Falló la operación');
  });
});