import { Injectable } from '@angular/core';
import { Camera } from '@awesome-cordova-plugins/camera/ngx';
import { ImageResizer } from '@awesome-cordova-plugins/image-resizer/ngx';
import { Platform } from '@ionic/angular';
import { CommonService } from '../common/common.service';
import { AlertService } from '../alert-service/alert-service.service';
import { UserinfoService } from '../userinfo/userinfo.service';
import { LocationService } from '../location/location.service';

@Injectable({
  providedIn: 'root'
})

/**
 * To Use the Service you should use UserInfo Service First and then save the values in it.
 * If fail to do system will crash.
 */
export class PhotoServiceService {

  constructor(
    private camera: Camera,
    private platform: Platform,
    private common: CommonService,
    private alert: AlertService,
    private user: UserinfoService,
    private location: LocationService
  ) {
  }

  isPhotoCapturedFromCamera: boolean = false;
  pickedImages: any[] = [];

  async capturePhoto(
    options: {
      isSynced: string,
      isSaveToPhotoAlbum: any,
      imageDetailsObj: { photo: { quality: number; targetSize: number } },
      sourceType: true,
      id1?: any,
      photoType?: any,
      id2?: any,
      isLocationMandatory: any,
      addDbFunction: () => Promise<any> | void
    }
  ) {
    let location = await this.location.getLocation();
    if (location.coords == null && options.isLocationMandatory) {
      return;
    }
      return new Promise<void>(async (resolve, reject) => {
      let cameraOptions = {
        quality: options.imageDetailsObj.photo.quality,
        sourceType: options.sourceType
          ? this.camera.PictureSourceType.PHOTOLIBRARY
          : this.camera.PictureSourceType.CAMERA,
        destinationType: this.camera.DestinationType.DATA_URL,
        cameraDirection: this.camera.Direction.BACK,
        saveToPhotoAlbum: options.isSaveToPhotoAlbum,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
        correctOrientation: true,
        targetHeight: options.imageDetailsObj.photo.targetSize,
        targetWidth: options.imageDetailsObj.photo.targetSize
      }

      await this.camera.getPicture(cameraOptions)
        .then(async (res) => {
          if (res) {
            const data = await this.onCameraSuccess(options.addDbFunction, res, options.isSynced, options.id1, options.photoType, options.id2, options.imageDetailsObj);
            resolve(data);
          }
          else {
            reject()
          }
        })
        .catch((err) => {
          if (err == 'No Image Selected') {
            resolve();
          }
          reject(err);
        })
    })
  }

  async onCameraSuccess(addDbFunction: () => Promise<any> | void, res: any, isSynced: string, id1?: any, photoType?: any, id2?: any, imageDetailsObj?: { photo: { quality: number; targetSize: number } }) {
    this.isPhotoCapturedFromCamera = true;
    return await this.onReSize(addDbFunction, isSynced, imageDetailsObj?.photo.targetSize, res, id1, photoType, id2);
  }

  private async onReSize(addDbFunction: () => Promise<any> | void, isSynced: string, longSideMax?: any, url?: any, id1?: any, photoType?: any, id2?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.src = url;
      img.onload = async () => {
        try {
          let targetWidth = img.width;
          let targetHeight = img.height;
          let aspect = img.width / img.height;

          if (img.width > img.height) {
            longSideMax = Math.min(img.width, longSideMax);
            targetWidth = longSideMax;
            targetHeight = longSideMax / aspect;
          } else {
            longSideMax = Math.min(img.height, longSideMax);
            targetHeight = longSideMax;
            targetWidth = longSideMax * aspect;
          }

          var canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          let ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, img.width, img.height, 0, 0, targetWidth, targetHeight);
          await this.common.addWatermark(ctx, img, targetWidth, targetHeight, "photos", this.isPhotoCapturedFromCamera);

          let canvasOutputFileType = 'image/jpeg';
          if (this.platform.is('android')) {
            canvasOutputFileType = 'image/png';
          }
          await this.onSuccessResize(addDbFunction, isSynced, url, canvas.toDataURL(canvasOutputFileType), id1, photoType, id2).then((data: any) => {
            if (data) {
              resolve(data);
            } else {
              reject()
            }
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = (err) => {
        reject(err);
      };
    });
  }

  private async onSuccessResize(
    addDbFunction: () => Promise<any> | void,
    isSynced: string,
    ImageURL: any,
    imageData: any,
    id1: any,
    photoType: any,
    id2: any
  ): Promise<any> {
    const maxFileSize = 307200; // 300 KB

    return new Promise(async (resolve, reject) => {
      if (imageData.length > maxFileSize) {
        if (this.platform.is('android')) {
          try {
            // Remove base64 metadata
            imageData = imageData.replace('data:image/jpeg;base64,', '');
            imageData = imageData.replace('data:image/png;base64,', '');

            // Resize image using the Image Resizer plugin
            (window as any).imageResizer.resizeImage(
              async (data: any) => {
                if (data.imageData.length > 409600) { // 400 KB
                  await this.alert.showAlert("The file you selected is large in size. Please select a smaller file.", "Photo Error");
                  return resolve(false);
                }

                // Generate a new file name
                const fileName = this.common.GetNewFileName(this.user.details.user.id, id1);

                const docObj = {
                  FileName: fileName,
                  CategoryId: photoType,
                  FileBase64: "data:image/jpeg;base64," + data.imageData,
                  LatLong: "",
                  MIME: 'image/jpeg',
                  IsSynced: isSynced
                };



                // Handle PNG format
                if (docObj.FileBase64.indexOf('image/png') != -1) {
                  docObj.FileName = docObj.FileName.replace('jpg', 'png');
                  docObj.MIME = 'image/png';
                }

                // Save the resized file
                const fileLocation = await this.common.saveFile(docObj, id2);
                if (fileLocation != '') {
                  docObj.FileBase64 = fileLocation;
                  const photosList = await this.addPhotoInList(addDbFunction, docObj, null, id1, id2);
                  photosList.Base64 = "data:image/jpeg;base64," + data.imageData;
                  resolve(photosList);
                } else {
                  resolve(false);
                }
              },
              (err: any) => {
                console.error("Error resizing image:", { err: err });
                reject(err);
              },
              imageData,
              0.8, // Scale factor (width)
              0.8, // Scale factor (height)
              {
                resizeType: (window as any).ImageResizer.RESIZE_TYPE_FACTOR,
                imageDataType: (window as any).ImageResizer.IMAGE_DATA_TYPE_BASE64,
                format: (window as any).ImageResizer.FORMAT_JPG
              }
            );
          } catch (err) {
            // this.alert.postErrorToBackend("PhotoService -> onSuccessResize()", { err: err });
            reject("PhotoService -> onSuccessResize()" + err);
          }
        } else {
          console.log("The file you selected is large in size. Please select a smaller file.");
          resolve(false);
        }
      } else {
        // Generate a new file name for the original image
        const fileName = this.common.GetNewFileName(this.user.details.user.id, id1);

        const docObj = {
          FileName: fileName,
          CategoryId: photoType,
          FileBase64: imageData,
          LatLong: "",
          MIME: 'image/jpeg',
          IsSynced: isSynced
        };

        // Handle PNG format
        if (docObj.FileBase64.indexOf('image/png') != -1) {
          docObj.FileName = docObj.FileName.replace('jpg', 'png');
          docObj.MIME = 'image/png';
        }

        // Save the original file
        try {
          const fileLocation = await this.common.saveFile(docObj, id2);
          if (fileLocation != '') {
            docObj.FileBase64 = fileLocation;
            const data = await this.addPhotoInList(addDbFunction, docObj, null, id1, id2);
            resolve(data);
          } else {
            resolve(false);
          }
        } catch (err) {
          // this.alert.postErrorToBackend("PhotoService -> capturePhoto()", { err: err });
          reject("PhotoService -> capturePhoto()" + err);
        }
      }
    });
  }

  private async addPhotoInList(addDbFunction: () => Promise<any> | void, item: any, position: any = null, appraisalId: any, jobId: any) {
    try {
      if (position != undefined && position != null) {
        item.LatLong = position.coords.latitude + "," + position.coords.longitude;
      }
      await addDbFunction();
      item.AppraisalId = appraisalId;
      this.pickedImages.push(item);
      return item;
    } catch (err) {
      return;
    }
    // });
  }

  photofromGallery(
    options: {
      isSynced: string,
      isSaveToPhotoAlbum: any,
      imageDetailsObj: { photo: { quality: number; targetSize: number } },
      sourceType: true,
      id1?: any,
      photoType?: any,
      isLocationMandatory: any,
      id2?: any,
      addDbFunction: () => Promise<any> | void
    }): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.pickedImages = [];

      (window as any).imagePicker.getPictures(
        async (result: any) => {
          if (!result || result.length == 0) {
            // User cancelled or no selection
            resolve([]);
            return;
          }

          let that: any = this;
          let func = async (result: any, resolve: any) => {
            if (result.length > 0) {
              await that.common.returnBase64Image(result.splice(0, 1)[0], async (base64: any) => {
                that.onGallerySuccess(base64.split(',')[1], options.id1, options.photoType, options.id2, options.imageDetailsObj).then(() => {
                  func(result, resolve);
                });
              });
            } else {
              resolve(this.pickedImages);
            }
          };

          func(result, resolve);
        },
        async (err: any) => {
          if (err.message == 'The image file could not be opened') {
            let photo = await this.capturePhoto(options)
            resolve(photo);
          }
          else {
            reject(JSON.stringify(err.mesage));
          }
        },
        {
          maximumImagesCount: 10,
          title: 'Select Photos',
          message: 'Pick max 10 items',
          width: options.imageDetailsObj.photo.targetSize,
          quality: options.imageDetailsObj.photo.quality
        }
      );
    });
  }

  private async onGallerySuccess(ImageURL: any, id1: any, photoType: any, id2: any, imageDetailsObj: any) {
    return new Promise(async (resolve, reject) => {
      try {
        ImageURL = 'data:image/jpeg;base64,' + ImageURL;
        this.isPhotoCapturedFromCamera = false;
        this.onReSize(imageDetailsObj.photo.targetSize, ImageURL, id1, photoType, id2).then((data: any) => {
          if (data) {
            resolve(data);
          } else {
            reject();
          }
        });

      } catch (err) {
        reject(err);
      }
    });
  }

  decodeTxtToBase64(filepath: any): Promise<string> {
    return new Promise((resolve, reject) => {
      this.common.retrieveFile(filepath, (base64Data: any) => {
        if (base64Data) {
          resolve(base64Data);
        } else {
          reject(null);
        }
      });
    });
  }

  async onDelete(deletePhotoFunction: () => Promise<any> | void, filePath: any, id: any, res: any): Promise<any> {
    try {
      await deletePhotoFunction();
      if (res) {
        await this.common.removeFile(filePath);
      }
    }
    catch (err) {
      throw err;
    }
  }

}
