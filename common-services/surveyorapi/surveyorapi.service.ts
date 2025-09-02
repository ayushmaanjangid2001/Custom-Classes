import { Inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { API_ENDPOINTS } from '../api/api-token';
import { AuthService } from '../auth/auth.service';

/**
 * 
 * Using serviceAuth1 for auth in request
 */
@Injectable({
  providedIn: 'root'
})
export class SurveyorapiService {

  constructor(
    private readonly api: ApiService,
    @Inject(API_ENDPOINTS) private readonly url: string,
    private readonly auth: AuthService
  ) { }

  async postError(data: any) {
    const res = await this.api.post(this.url, data, this.auth.auth1);
    return res;
  }

  async getData(url: string) {
    const res = await this.api.get(url, this.auth.auth1);
    return res;
  }

  async postData(url: string, data: any) {
    const res = await this.api.post(url, data, this.auth.auth1);
    return res;
  }

  async fetchUserDetailsLogin(url: string, data: any, auth: any) {
    const res = await this.api.post(url, data, auth);
    return res;
  }

}
