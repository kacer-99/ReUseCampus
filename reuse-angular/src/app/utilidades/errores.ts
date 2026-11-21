// Convierte un error HTTP en un mensaje comprensible para el usuario
export function mensajeError(error: any, porDefecto = 'Ocurrió un error inesperado'): string {
  // status 0: el navegador no logró comunicarse con la API
  if (error?.status === 0) {
    return 'No hay comunicación con el servidor. Verifique que la API esté encendida.';
  }
  // La API responde { mensaje: '...' } en sus errores
  return error?.error?.mensaje || porDefecto;
}