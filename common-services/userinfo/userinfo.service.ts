import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
/**
 * Use This Service to Setup the user id, name and other device info
 * 
 */
export class UserinfoService {

  constructor() { }
  public details = {
    user: {
      name: 'Guest',
      id: 0,
      isLoggedIn: false,
      position: null,
      siebelUserId: '',
      GalleryOption: '',
      password: ''
    },
    device: {
      deviceIMEINo: '',
      deviceUUID: '',
    }
  };
}
