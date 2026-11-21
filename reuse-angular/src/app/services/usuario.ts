import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mensaje, Usuario } from '../models/modelos';

// Datos para crear o editar un usuario (solo administrador)
export interface UsuarioFormulario {
  nombre: string;
  correo: string;
  password?: string;
  rol: string;
  estado?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl = 'http://localhost:3000/api/usuarios';

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  createUsuario(usuario: UsuarioFormulario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  updateUsuario(id: number, usuario: UsuarioFormulario): Observable<Mensaje> {
    return this.http.put<Mensaje>(`${this.apiUrl}/${id}`, usuario);
  }

  // Baja lógica: el usuario queda INACTIVO
  desactivarUsuario(id: number): Observable<Mensaje> {
    return this.http.delete<Mensaje>(`${this.apiUrl}/${id}`);
  }
}