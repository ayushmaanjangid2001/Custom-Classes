import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor(private alertController: AlertController) { }

  private alert: HTMLIonAlertElement | null = null;

  async showConfirmAlert(header: string, message: string, okText = 'OK', cancelText = 'Cancel'): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      const alert = await this.alertController.create({
        header,
        message,
        buttons: [
          {
            text: cancelText,
            role: 'cancel',
            handler: () => resolve(false),
          },
          {
            text: okText,
            handler: () => resolve(true),
          },
        ],
      });
      await alert.present();
    });
  }

  async showAlert(message: string = 'Error', header: string = 'Alert'): Promise<void> {
    if (typeof window == 'undefined' || !document) {
      return;
    }
    if (this.alert) {
      await this.hideAlert();
    }
    this.alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await this.alert.present();
    this.alert.onDidDismiss().then(() => {
      this.alert = null;
    })
      .catch(() => {
        this.alert = null;
      })
  }

  async hideAlert(): Promise<void> {
    if (typeof window == 'undefined' || !document) {
      return;
    }
    if (!this.alert) {
      return;
    }
    await this.alert.dismiss();
    this.alert = null;
  }
}
