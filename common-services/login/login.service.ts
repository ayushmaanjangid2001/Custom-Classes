import { Inject, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommonService } from '../common/common.service';
import { ENCRYPTED_KEY } from '../api/api-token';
import { DbService } from '../db-service/db-service.service';
import { MD5 } from 'crypto-js';
import { UserinfoService } from '../userinfo/userinfo.service';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { AppService } from '../app/app.service';
import { DeviceinfoService } from '../deviceinfo/deviceinfo.service';
import { SurveyorapiService } from '../surveyorapi/surveyorapi.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    private common: CommonService,
    @Inject(ENCRYPTED_KEY) private ENCRYPTED_KEY: string,
    private db: DbService,
    private user: UserinfoService,
    private device: Device,
    private app: AppService,
    private deviceInfo: DeviceinfoService,
    private surveyorApi: SurveyorapiService,
    private auth: AuthService,
    private router: Router
  ) { }
  async loginInitializer(inputForm: FormGroup) {

    let settings = JSON.parse(localStorage.getItem("AppSettings") || "null");

    if (!settings) {
      settings = {};
      settings.isAutoLoginSet = false;
      settings.SaveToPhotoAlbum = true;
      settings.cameraPreview = false;

      localStorage.setItem("AppSettings", JSON.stringify(settings));
    }

    let autoLogin = JSON.parse(localStorage.getItem("AutoLogin") || "null");
    //If AutoLogin Selected
    if (autoLogin) {
      let userName = this.common.decryptByDES(autoLogin.username, ENCRYPTED_KEY);

      let res = await this.db.selectSqlQueryWithParams("Select * from Users Where UserName=?", [userName], "selectUserByUserName");

      let savedPassword;
      savedPassword = res.rows.item(0).Password;
      let Token = res.rows.item(0).Token;
      let userId = res.rows.item(0).Id

      let loginForm = {
        username: userName,
        password: savedPassword,
        Token: Token,
        Id: userId
      }

      inputForm.controls['username'].setValue(userName);
      inputForm.controls['password'].setValue("**************");

      await this.loginUser(loginForm, true);

    }
  }
  private async loginUser(loginForm: any, isAutoLogin: boolean) {

    let inputUser = loginForm;

    this.user.details.user.isLoggedIn = false;

    let cred = '';
    let credForLogin = ''

    let passwordMd5 = MD5(inputUser.password);

    if (isAutoLogin) {
      passwordMd5 = inputUser.password;
    }

    let currentVersion = localStorage.getItem('CurrentVersion');

    cred = inputUser.username + ':'                         //10725
      + inputUser.Token + ':'                                   //f91e15dbec69fc40f81f0876e7009648 (Pass@123)
      + this.deviceInfo.getDeviceInfoAsString() + ':'
      + this.device.uuid + ':'                              //3c4465aa95af83b7
      + inputUser.Id + ':0:'                                //0 Intially
      + this.user.details.device.deviceIMEINo + ':AuthRequired:'           //blank
      + currentVersion

    credForLogin = inputUser.username + ':'                         //10725
      + passwordMd5 + ':'                                   //f91e15dbec69fc40f81f0876e7009648 (Pass@123)
      + this.deviceInfo.getDeviceInfoAsString() + ':'
      + this.device.uuid + ':'                              //3c4465aa95af83b7
      + this.user.details.user.id + ':1:'                                //0 Intially
      + this.user.details.device.deviceIMEINo + ':AuthRequired:'           //blank
      + currentVersion

    this.user.details.device.deviceUUID = this.device.uuid;

    // Add :Y:Y if autoLogin
    if (isAutoLogin && !this.app.isOnline()) {
      credForLogin = credForLogin + ':Y:Y';
      cred = cred + ":Y"
    }

    //Base 64 encoding of credential string and adding 'Basic ' in front of it
    cred = 'Basic ' + btoa(cred);
    credForLogin = 'Basic ' + btoa(credForLogin)

    if (this.app.isOnline()) {

      // Payload for GetUserDetail Service
      let data = {
        UserId: inputUser.username,
        SurveyorId: 0
      };

      // Calling GetUserDetail Service
      const response: any = await this.surveyorApi.fetchUserDetailsLogin("url", data, credForLogin);

      let errorMessage = response?.ErrorMessage ?? '';

      let isSuccess = response.IsSuccess;

      if (errorMessage == 'Outdated App Version. Please Update.' && !isSuccess) {
        await this.app.checkAndUpdateApp();
      }

      if (isSuccess) {

        for (let i = 0; i < response.Users.length; i++) {
          let fetchedUser = response.Users[i];

          this.user.details.user.id = fetchedUser.Id;
          this.user.details.user.name = fetchedUser.Username;
          this.user.details.user.isLoggedIn = true;

          if (!fetchedUser.Password) {
            fetchedUser.Password = passwordMd5;
          }
          if (fetchedUser.UserToken) {
            let credString = this.user.details.user.name + ":"
              + fetchedUser.UserToken + ":"
              + this.deviceInfo.getDeviceInfoAsString() + ":"
              + this.deviceInfo.getDeviceUUID() + ":"
              + this.user.details.user.id + ":0:"
              + this.user.details.device.deviceIMEINo + ":AuthRequired:"
              + currentVersion + ':Facility' + ":Y"; //change to currentVersion

            let credStringForLogin = this.user.details.user.name + ":"
              + fetchedUser.UserToken + ":"
              + this.deviceInfo.getDeviceInfoAsString() + ":"
              + this.deviceInfo.getDeviceUUID() + ":"
              + this.user.details.user.id + ":0:"
              + this.user.details.device.deviceIMEINo
              + ":AuthRequired:"
              + currentVersion + ':Facility' + ":Y";
            this.auth.auth1 = "Basic " + btoa(credString);
            this.auth.auth2 = "Basic " + btoa(credStringForLogin);
          }
          this.router.navigateByUrl('/home');

        }

      }

    }
  }
}
