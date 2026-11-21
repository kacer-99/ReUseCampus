import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Entrega, Mensaje } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class EntregaService {
  private readonly apiUrl = 'http://localhost:3000/api/entregas';

  constructor(private http: HttpClient) {}

  getMisEntregas(): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(`${this.apiUrl}/mias`);
  }

  confirmar(id: number): Observable<Mensaje> {
    return this.http.put<Mensaje>(`${this.apiUrl}/${id}/confirmar`, {});
  }
}