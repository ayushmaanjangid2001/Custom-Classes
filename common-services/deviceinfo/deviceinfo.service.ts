import { Injectable } from '@angular/core';
import { Device } from '@awesome-cordova-plugins/device/ngx';

declare var device: any;

@Injectable({
  providedIn: 'root'
})
export class DeviceinfoService {

  constructor(private device: Device) { }

  public getDeviceInfoAsString() {
    return `DeviceName=undefined;` +
      `DevicePhoneGap=undefined;` +
      `DevicePlatform=${this.device.platform};` +
      `DeviceUUID=${this.device.uuid};` +
      `DeviceVersion=${this.device.version};` +
      `DeviceIMEI=`;
  }

  public getDeviceUUID() {
    return this.device.uuid;
  }

  public getIMEI(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof device !== 'undefined' && device.getDeviceInfo) {
        device.getDeviceInfo(
          (info: any) => {
            resolve(info.imei);
          },
          (err: any) => {
            // console.error('Error retrieving IMEI:',{err:err});
            reject(JSON.stringify(err));
          }
        );
      } else {
        reject('Device information plugin is not available.');
      }
    });
  }
}
