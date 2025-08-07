import { ErrorHandler, Injectable } from '@angular/core';
import { AppService } from '../app/app.service';
import { UserinfoService } from '../userinfo/userinfo.service'
import { AuthService } from '../auth/auth.service';
import { DbService } from '../db-service/db-service.service';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalerrorhandlerService implements ErrorHandler {

  constructor(
    private user: UserinfoService,
    private app: AppService,
    private auth: AuthService,
    private db: DbService,
    private api: ApiService
  ) { }

  /**
   * To Use this Globas Error handler service in the app.module in provider add this line 
   * {provide: ErrorHandler, useClass: GlobalerrorhandlerService}
   * In try and catch block just throw the error like this throw({location:"COMING_FROM",err})
   * 
   * @param error Error Object 
   */
  handleError(error: any) {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const { fullStack } = this.parseAnyError(error);
    const errorObject = {
      stack: fullStack
    };

    const errorDetails = {
      Surveyor_Id: this.user.id,
      Description: `Device ID: ${this.user.deviceUUID}
                    UserName: ${this.user.name}
                    Device Manufacture: ${(window as any).device?.manufacturer}
                    Device Model: ${(window as any).device?.model}
                    Device Platform: ${(window as any).device?.platform}
                    Full Stack Trace:${JSON.stringify(errorObject, null, 2)}`,
      Time_Occured: formattedDate,
    };

    console.error('Global Error:', errorDetails);
    this.postErrorToBackend(errorDetails);
  }

  private parseAnyError(error: any): { location: string; fullStack: any } {
    let location = '';
    let stack: any = error;
    try {
      if (typeof error === 'object' && error !== null) {
        if ('err' in error && typeof error.err === 'object') {
          location = error.location || error.source || '';
          stack = error.err;
        } else if ('stack' in error || 'message' in error) {
          location = error.location || '';
          stack = error;
        } else {
          location = error.location || '';
          stack = error;
        }
      } else if (typeof error === 'string') {
        stack = error;
      } else {
        stack = JSON.stringify(error);
      }
    } catch (parseErr) {
      stack = `Failed to parse error: ${parseErr}`;
    }

    return { location, fullStack: stack };
  }

  private async selectAllError() {
    const query = "SELECT * FROM ErrorLog";
    let errors = await this.db.selectSqlQueryWOParams(query, "selectAllError()");
    return errors;
  }

  private async deleteDataFromError(id: any) {
    const query = "DELETE FROM ErrorLog WHERE Id = ?";
    await this.db.deleteSqlQuery(query, [id], "deleteDataFromError()")
  }

  private async insertIntoErrorLog(err: any) {
    const query = "INSERT INTO ErrorLog (SurveyorId, ErrorMessage, CreatedOn) VALUES (?,?,?)"
    const param = [
      err.Surveyor_Id,
      err.Description,
      err.Time_Occured
    ]
    await this.db.insertSqlQueryWOInsertId(query, param, "insertIntoErrorLog()")
  }
  private async postErrorToBackend(err: any) {
    if (this.app.isOnline() && this.auth.auth1 != "") {
      const errors = await this.selectAllError();
      if (errors != null && errors.length > 0 && errors) {
        for (let i = 0; i < errors.length; i++) {
          let error = {
            Surveyor_Id: errors[i].SurveyorId,
            Description: errors[i].ErrorMessage,
            Time_Occured: errors[i].CreatedOn,
          };
          /**
          * Change the function accordingly
          */
          // const res: any = await this.surveyorService.postError(error, this.auth.serviceAuth1);
          const res: any = true;
          if (!res.IsSuccess) {
            throw new Error("Failed to post error log");
          } else {
            this.deleteDataFromError(errors[i].Id);
          }
        }
        if (err != null || err != undefined) {
          /**
           * Change the function accordingly
           */
          // const res: any = await this.surveyorService.postError(errorDetails, this.auth.serviceAuth1);
          const res: any = true;
          if (!res.IsSuccess) {
            throw new Error("Failed to post error log");
          }
        }
      }
      else {
        if (err != null || err != undefined) {
          await this.insertIntoErrorLog(err);
        }
      }
    }
  }
}
