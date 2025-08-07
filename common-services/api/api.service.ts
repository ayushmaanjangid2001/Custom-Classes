import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { API_BASE_URL } from './api-token';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

/**
 * To Use this Service add 
 * { provide: API_BASE_URL, useValue: environment.apiUrl } in your providers
 */
export class ApiService {

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private baseUrl: string
  ) { }

  private BASE_URL: string = this.baseUrl

  public get(path: string, auth: any) {
    return lastValueFrom(this.http.get(
      this.BASE_URL + path,
      {
        headers: {
          Authorization: auth,
          "Access-Control-Allow-Origin": "Origin"
        }
      }
    ))
  }

  public post(path: string, payload: any, auth: any) {
    return lastValueFrom(this.http.post(
      this.BASE_URL + path,
      payload,
      {
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json',
          "Access-Control-Allow-Origin": this.BASE_URL
        },
      }
    ))
  }

}
