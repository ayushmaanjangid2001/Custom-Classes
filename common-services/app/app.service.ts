import { Inject, Injectable } from '@angular/core';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { AlertService } from '../alert-service/alert-service.service';
import { APP_UPDATE_XML_CONFIG_FILE } from '../api/api-token';

declare var IRoot: any;

@Injectable({
  providedIn: 'root'
})
export class AppService {

  private APP_UPDATE = 'Failed to update the app'
  private APP_UPDATE_HEADER = 'Update Error'
  private config = this.configFile
  public DEFAULT_ERROR = "Permission Request Failed. Please try again."
  public DEFAULT_ERROR_HEADER = "Error"
  public ROOTED_DEVICE = "Can't Run the App. Device is Rooted"
  public ROOTED_DEVICE_HEADER = "Device Error"
  private isInitialized = false;

  constructor(
    private network: Network,
    private appVersion: AppVersion,
    private androidPermission: AndroidPermissions,
    private alert: AlertService,
    @Inject(APP_UPDATE_XML_CONFIG_FILE) private configFile: string
  ) { }

  /**
   * 
   * @returns Is Device connected to internet or not
   */
  isOnline() {
    return this.network.type == 'none' ? false : true;
  }

  /**
   * Save App Version in the local storage
   */
  async saveAppVersion() {
    var version = await this.appVersion.getVersionNumber()
    localStorage.setItem("CurrentVersion", version);
  }

  /**
   * This is use to Update App to the latest version.
   * TO use this first give the providers in the app.module
   * { provide: APP_UPDATE_XML_CONFIG_FILE, useValue: environment.XMLConfig }
   * Also add android-versionCode="20401" in widget in config.xml file.
   * <widget android-versionCode="20401" id="io.ionic.ITGIWorkShopProd" version="2.4.1" xmlns="http://www.w3.org/ns/widgets" 
   * xmlns:cdv="http://cordova.apache.org/ns/1.0">
   * 
   */
  async checkAndUpdateApp() {
    await this.androidPermission.requestPermission(this.androidPermission.PERMISSION.READ_EXTERNAL_STORAGE)
      .then(async (res: any) => {
        await (window as any).AppUpdate.checkAppUpdate(this.config, (update: any) => { });
      })
      .catch(async (err: any) => {
        await this.alert.showAlert(this.APP_UPDATE, this.APP_UPDATE_HEADER);
      })
  }

  /**
   * To grant permissions. Pass the permissions array directly in the function.
   * @param permissions Permission you want 
   */
  private async grantPermission(permissions: any[]) {
    await this.androidPermission.requestPermissions(permissions)
      .then(() => { })
      .catch(async () => {
        await this.alert.showAlert(this.DEFAULT_ERROR, this.DEFAULT_ERROR_HEADER);
      })
  }

  /**
 * Check if the device is rooted.
 * If rooted, show an alert and prevent further usage of the app.
 * To Use this install the "cordova-plugin-iroot" plugin
 * 
 * @returns {Promise<boolean>}
 */
  private async isRooted(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (typeof (IRoot) != 'undefined' && IRoot) {
        IRoot.isRooted(
          async (data: any) => {
            if (data && data == 1) {
              await this.alert.showAlert(this.ROOTED_DEVICE, this.ROOTED_DEVICE_HEADER)
              resolve(true);
            } else {
              resolve(false);
            }
          },
          async (data: any) => {
            await this.alert.showAlert(this.DEFAULT_ERROR, this.DEFAULT_ERROR_HEADER);
            resolve(false);
          }
        );
      } else {
        await this.alert.showAlert(this.DEFAULT_ERROR, this.DEFAULT_ERROR_HEADER);
        resolve(false);
      }
    });
  }

  /**
   * Function is used to Init the app by providing the permission and check whether rooted or 
   * not. if not rooted then an alert will be shown.
   * @param permissions  Permission you want 
   * @returns NULL
   */
  async initApp(permissions: any[]) {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;
    let isRoot = await this.isRooted();
    if (!isRoot) {
      await this.grantPermission(permissions);
    }
  }
}
