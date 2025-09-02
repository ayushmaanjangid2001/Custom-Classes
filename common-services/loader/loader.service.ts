import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loader: HTMLIonLoadingElement | null = null;

  constructor(private loadingController: LoadingController) { }

  async showLoader(message: string = 'Please wait...'): Promise<void> {
    if (this.loader) {
      this.loader.message = message;
      return;
    }

    try {
      this.loader = await this.loadingController.create({
        message,
        spinner: 'crescent',
        backdropDismiss: false,
      });

      await this.loader.present();
    } catch (error) {
      this.loader = null;
    }
  }

  async hideLoader(): Promise<void> {
    if (!this.loader) {
      return;
    }

    try {
      await this.loader.dismiss();
    } catch (error) {
    } finally {
      this.loader = null;
    }
  }
}
