import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mensaje, Solicitud } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly apiUrl = 'http://localhost:3000/api/solicitudes';

  constructor(private http: HttpClient) {}

  getMisSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.apiUrl}/mias`);
  }

  createSolicitud(publicacionId: number, mensaje: string): Observable<Solicitud> {
    return this.http.post<Solicitud>(this.apiUrl, { publicacionId, mensaje });
  }

  aceptar(id: number): Observable<Mensaje> {
    return this.http.put<Mensaje>(`${this.apiUrl}/${id}/aceptar`, {});
  }

  rechazar(id: number): Observable<Mensaje> {
    return this.http.put<Mensaje>(`${this.apiUrl}/${id}/rechazar`, {});
  }

  cancelar(id: number): Observable<Mensaje> {
    return this.http.put<Mensaje>(`${this.apiUrl}/${id}/cancelar`, {});
  }
}