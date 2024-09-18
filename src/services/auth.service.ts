import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8000/api';  // Update with your backend URL

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login/`, { username, password });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout/`, {});
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/profile/`);  // Get logged-in user's profile
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/`);  // Fetch the list of users
  }
}
