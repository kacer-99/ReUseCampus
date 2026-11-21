// Modelos: describen la forma de los datos que entrega la API

export type Rol = 'USUARIO' | 'ADMINISTRADOR';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  estado?: string;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export interface Publicacion {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  modalidad: string;
  estado: string;
  fechaPublicacion: string;
  usuarioId: number;
  propietarioNombre: string;
  solicitudesPendientes: number;
}

// Datos que se envían al crear o editar una publicación
export interface PublicacionNueva {
  titulo: string;
  descripcion: string;
  categoria: string;
  modalidad: string;
}

export interface Solicitud {
  id: number;
  publicacionId: number;
  solicitanteId: number;
  mensaje: string;
  fechaSolicitud: string;
  estado: string;
  solicitanteNombre?: string;
  publicacionTitulo?: string;
  publicacionEstado?: string;
  propietarioId?: number;
  propietarioNombre?: string;
}

export interface Entrega {
  id: number;
  publicacionId: number;
  solicitudId: number;
  propietarioId: number;
  receptorId: number;
  fechaAcuerdo: string;
  fechaEntrega: string | null;
  estado: string;
  publicacionTitulo: string;
  publicacionEstado: string;
  propietarioNombre: string;
  receptorNombre: string;
}

export interface Mensaje {
  mensaje: string;
}

export const CATEGORIAS = ['Libros', 'Componentes', 'Calculadoras', 'Accesorios', 'Materiales', 'Otros'];
export const MODALIDADES = ['DONACION', 'INTERCAMBIO'];
export const ESTADOS_PUBLICACION = ['DISPONIBLE', 'RESERVADA', 'ENTREGADA', 'CANCELADA'];