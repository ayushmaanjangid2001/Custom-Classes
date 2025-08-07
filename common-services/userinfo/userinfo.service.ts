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

  name = 'Guest'

  id = 0
  
  isLoggedIn = false
  
  deviceIMEINo = ''

  deviceUUID = ''
  
  position: any = null
  
  siebelUserId = ''
  
  GalleryOption = ''
  
  password = ''
}
