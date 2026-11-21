import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mensaje, Publicacion, PublicacionNueva, Solicitud } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class PublicacionService {
  private readonly apiUrl = 'http://localhost:3000/api/publicaciones';

  constructor(private http: HttpClient) {}

  // Lista con filtros opcionales (estado, categoria, modalidad)
  getPublicaciones(filtros: { estado?: string; categoria?: string; modalidad?: string } = {}): Observable<Publicacion[]> {
    let params = new HttpParams();
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.categoria) params = params.set('categoria', filtros.categoria);
    if (filtros.modalidad) params = params.set('modalidad', filtros.modalidad);
    return this.http.get<Publicacion[]>(this.apiUrl, { params });
  }

  getMisPublicaciones(): Observable<Publicacion[]> {
    return this.http.get<Publicacion[]>(`${this.apiUrl}/mias`);
  }

  getPublicacionById(id: number): Observable<Publicacion> {
    return this.http.get<Publicacion>(`${this.apiUrl}/${id}`);
  }

  getSolicitudesDe(id: number): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.apiUrl}/${id}/solicitudes`);
  }

  createPublicacion(publicacion: PublicacionNueva): Observable<Publicacion> {
    return this.http.post<Publicacion>(this.apiUrl, publicacion);
  }

  updatePublicacion(id: number, publicacion: PublicacionNueva): Observable<Publicacion> {
    return this.http.put<Publicacion>(`${this.apiUrl}/${id}`, publicacion);
  }

  // No borra: la API cancela la publicación
  cancelarPublicacion(id: number): Observable<Mensaje> {
    return this.http.delete<Mensaje>(`${this.apiUrl}/${id}`);
  }
}