import { Component, OnInit } from '@angular/core';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { PhotoLibrary } from '@awesome-cordova-plugins/photo-library/ngx';
import { PhotoDocsSizeService } from '../../photo-docs-size/photo-docs-size.service';
import { NavController } from '@ionic/angular';
import { PhotoServiceService } from '../../photo-service/photo-service.service';

@Component({
  selector: 'app-inappcamera',
  templateUrl: './inappcamera.component.html',
  styleUrls: ['./inappcamera.component.scss'],
})
/**
 * When using accept image function provide the parameters.
 *     "cordova-plugin-camera-preview": "github:cordova-plugin-camera-preview/cordova-plugin-camera-preview",
 */
export class InappcameraComponent implements OnInit {

  constructor(
    private file: File,
    private photoLibrary: PhotoLibrary,
    private size: PhotoDocsSizeService,
    private navController: NavController,
    private photo: PhotoServiceService
  ) { }

  image: any;
  cameraActive = false;
  previewActive = false;
  flashOn: boolean = false;
  orientation: 'portrait' | 'landscape' = 'portrait';
  screenHeight = 0;
  screenWidth = 0;
  zoomLevel: number = 0;
  maxZoom: number = 1;
  zoomStep: number = 1;
  id: any
  description: any
  categoryName: any
  appraisalType: any
  isSynced: any
  id1: any
  id2: any
  type: any

  async ngOnInit() {

    this.updateScreenInfo();
    window.addEventListener('orientationchange', this.handleOrientationChange);
    this.launchCameraAfterOrientationHandled();
    await this.launchCamera();
  }

  private base64ToBlob(base64Data: string, contentType: string) {
    const sliceSize = 512;
    const byteCharacters = atob(base64Data.split(',')[1]); // Remove data:image/jpeg;base64,
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  async saveBase64ToGallery(base64: string, fileName = 'image.jpg') {
    const blob = this.base64ToBlob(base64, 'image/jpeg');
    const folderPath = this.file.externalRootDirectory + 'DCIM/MyApp/';

    // Create folder if it doesn't exist
    try {
      await this.file.checkDir(this.file.externalRootDirectory!, 'DCIM/MyApp');
    } catch {
      await this.file.createDir(this.file.externalRootDirectory!, 'DCIM/MyApp', false);
    }
    await this.file.writeFile(folderPath, fileName, blob, { replace: true });
    if ((window as any).MediaScannerPlugin) {
      (window as any).MediaScannerPlugin.scanFile(folderPath + fileName, () => {
        console.log('MediaScanner scan complete');
      }, (err: any) => {
        console.error('MediaScanner failed:', err);
      });
    }
  }

  async launchCamera() {
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    const cameraPreviewOptions = {
      position: 'front',
      parent: 'content',
      className: '',
      camera: (window as any).CameraPreview.CAMERA_DIRECTION.BACK,
      width: this.screenWidth,
      height: screenHeight,
      toBack: true,
      storeToFile: false,
      alpha: 1,
      disableExifHeaderStripping: false,
      flashMode: this.flashOn ? 'on' : 'off',
    };
    this.flashOn = false;
    await (window as any).CameraPreview.getFlashMode(async (currentMode: any) => {
      (window as any).CameraPreview.setFlashMode((window as any).CameraPreview.FLASH_MODE.OFF);
      this.flashOn = false
    })

    await (window as any).CameraPreview.getMaxZoom(async (zoom: any) => {
      this.maxZoom = zoom;
    })

    await (window as any).CameraPreview.startCamera(cameraPreviewOptions);
    this.cameraActive = true;
  }

  async zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel + this.zoomStep, this.maxZoom);
    (window as any).CameraPreview.setZoom(this.zoomLevel);
  }

  async zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel - this.zoomStep, 0);
    (window as any).CameraPreview.setZoom(this.zoomLevel);
  }

  async toggleFlash() {
    (window as any).CameraPreview.getFlashMode(async (currentMode: any) => {
      if (currentMode == (window as any).CameraPreview.FLASH_MODE.ON) {
        (window as any).CameraPreview.setFlashMode((window as any).CameraPreview.FLASH_MODE.OFF);
        this.flashOn = !this.flashOn;
      } else {
        (window as any).CameraPreview.setFlashMode((window as any).CameraPreview.FLASH_MODE.ON);
        this.flashOn = !this.flashOn;
      }
    })

  }

  async relaunchCamera() {
    await this.stopCamera();
    await this.launchCamera();
  }

  async takePicture() {
    let cameraPreviewPictureOptions = {};
    cameraPreviewPictureOptions = {
      quality: this.size.size.photo.quality,
      width: this.size.size.photo.targetSize,
      height: this.size.size.photo.targetSize,
    };

    await (window as any).CameraPreview.takePicture(cameraPreviewPictureOptions, async (base64Image: any) => {
      this.image = `data:image/jpeg;base64,${base64Image}`;
      this.previewActive = true;
      this.stopCamera();
    });
  }

  async stopCamera() {
    await (window as any).CameraPreview.stopCamera();
    this.cameraActive = false;
  }

  async flipCamera() {
    await (window as any).CameraPreview.switchCamera();
  }

  async goBack() {
    await this.stopCamera();
    this.navController.back();
  }

  async ngOnDestroy() {
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    await this.stopCamera();
  }

  handleOrientationChange = () => {
    setTimeout(() => {
      this.updateScreenInfo();
      if (!this.previewActive) {
        this.relaunchCamera();
      }
    }, 300); // Wait a bit for orientation to settle
  };

  updateScreenInfo() {
    this.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
  }

  checkOrientation() {
    this.orientation = window.matchMedia('(orientation: portrait)').matches
      ? 'portrait'
      : 'landscape';
    console.log('Orientation is now:', this.orientation);
  }

  async launchCameraAfterOrientationHandled() {
    await this.launchCamera();
  }

  async denyPicture() {
    this.previewActive = false;
    this.flashOn = false;
    this.image = null;
    await this.launchCamera();
  }

  async acceptPicture() {
    // await this.stopCamera();
    let image: any;
    this.saveBase64ToGallery(this.image, `captured_${Date.now()}.jpg`);
    await this.photo.onCameraSuccess(this.saveDbFunction, this.image, "false", this.id1, this.type, this.id2, this.size.size)
    await this.navController.pop();
  }

  saveDbFunction() { }

}
