import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Sesion, Usuario } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api/auth';

  // Usuario con sesión iniciada (null si no ha iniciado sesión)
  usuario = signal<Usuario | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.usuario.set(this.leerUsuarioGuardado());
  }

  login(correo: string, password: string): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.apiUrl}/login`, { correo, password })
      .pipe(tap(sesion => this.guardarSesion(sesion)));
  }

  registro(nombre: string, correo: string, password: string): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.apiUrl}/registro`, { nombre, correo, password })
      .pipe(tap(sesion => this.guardarSesion(sesion)));
  }

  logout(): void {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    } catch (error) { /* sin almacenamiento disponible */ }
    this.usuario.set(null);
    this.router.navigate(['/login']);
  }

  token(): string | null {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      return null;
    }
  }

  estaAutenticado(): boolean {
    return this.token() !== null && this.usuario() !== null;
  }

  esAdministrador(): boolean {
    return this.usuario()?.rol === 'ADMINISTRADOR';
  }

  private guardarSesion(sesion: Sesion): void {
    try {
      localStorage.setItem('token', sesion.token);
      localStorage.setItem('usuario', JSON.stringify(sesion.usuario));
    } catch (error) { /* sin almacenamiento disponible */ }
    this.usuario.set(sesion.usuario);
  }

  private leerUsuarioGuardado(): Usuario | null {
    try {
      const texto = localStorage.getItem('usuario');
      return texto ? JSON.parse(texto) as Usuario : null;
    } catch (error) {
      return null;
    }
  }
}