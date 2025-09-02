import { Injectable } from '@angular/core';
import { Geolocation } from '@awesome-cordova-plugins/geolocation/ngx';
import { UTILS } from 'src/app/shared/utils';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private location: any = {}
  constructor(
    private geoLocation: Geolocation
  ) { }

  /**
   * To get coordinates of the mobile device.To access the location use location.coords
   * 
   * @returns An Object of location of coordinates 
   */
  public async getLocation() {
    let location: any = await this.geoLocation.getCurrentPosition({ timeout: 5000, enableHighAccuracy: true });
    if (location.message != 'Timeout expired' || location.coords) {
      this.location.coords = location.coords
    }
    else {
      this.location.coords = null;
    }
    return this.location;
  }
}
