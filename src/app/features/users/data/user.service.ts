import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/http/page';
import { CreateUserRequest, UpdateUserRequest, User, UserSearch } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  search(query: UserSearch = {}): Observable<Page<User>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      const text = String(value).trim();
      if (text) params = params.set(key, text);
    }
    return this.http.get<Page<User>>(this.baseUrl, { params });
  }

  findById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  create(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.baseUrl, request);
  }

  update(id: string, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${encodeURIComponent(id)}`, request);
  }

  setActive(id: string, active: boolean): Observable<User> {
    const action = active ? 'activate' : 'deactivate';
    return this.http.patch<User>(`${this.baseUrl}/${encodeURIComponent(id)}/${action}`, null);
  }

  resetPassword(id: string, temporaryPassword: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/${encodeURIComponent(id)}/reset-password`, {
      temporaryPassword,
    });
  }
}
