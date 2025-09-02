import { Injectable } from '@angular/core';
import { FileEntry } from '@awesome-cordova-plugins/file/ngx';
import { enc, DES, mode, pad, lib } from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor() { }

  public addWatermark(
    ctx: any, tempImg: any, targetWidth: any, targetHeight: any, calledBy: any, isPhotoCapturedFromCamera: any
  ): Promise<any> {
    return new Promise((resolve) => {
      let photocapturedfromcamera = isPhotoCapturedFromCamera;

      ctx.font = "24px sans-serif";

      const date = new Date();
      const formatNumber = (num: number) => num.toString().padStart(2, "0");

      const day = formatNumber(date.getDate());
      const month = formatNumber(date.getMonth() + 1);
      const year = date.getFullYear();
      const hours = formatNumber(date.getHours());
      const minutes = formatNumber(date.getMinutes());
      const seconds = formatNumber(date.getSeconds());

      const text = `${day}/${month}/${year}  ${hours}:${minutes}:${seconds}`;
      const textWidth = ctx.measureText(text).width;

      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "#444";

      if (photocapturedfromcamera) {
        ctx.fillText(text, targetWidth - textWidth - 10 + 2, targetHeight - 20 + 2);
        ctx.font = "12px sans-serif";
        ctx.fillText("MAC", targetWidth - 50 - 10 + 2, 20 - 2);
      } else {
        ctx.font = "12px sans-serif";
        ctx.fillText("MAG", targetWidth - 50 - 10 + 2, 20 - 2);
      }

      resolve(true); // Resolve the promise when the watermark has been added
    });
  }

  GetNewFileName(userId: any, id1: any) {
    let fileName = "";
    fileName = userId + "_" + id1 + "_";
    var date = new Date();
    var components = [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    ];

    fileName += components.join("");
    return fileName + ".jpg";
  }

  desEncryption(text: any, key: any) {

    let encryptedText = enc.Utf8.parse(text);

    let keyHex = enc.Utf8.parse(key);

    let iv = new Uint8Array(0);

    let ivHex = enc.Hex.parse(enc.Utf8.parse(iv.toString()).toString(enc.Hex))

    let encrypted = DES.encrypt(encryptedText, keyHex, { iv: ivHex, mode: mode.ECB, padding: pad.Pkcs7 });

    let finalEncrypted = enc.Base64.stringify(encrypted.ciphertext);

    return finalEncrypted;

  }

  decryptByDES(ciphertext: any, key: any) {

    let keyHex = enc.Utf8.parse(key);

    const cipherParams = lib.CipherParams.create({
      ciphertext: enc.Base64.parse(ciphertext)
    })

    let decrypted = DES.decrypt(cipherParams, keyHex, {
      mode: mode.ECB,
      padding: pad.Pkcs7
    })

    return decrypted.toString(enc.Utf8);

  }

  private dataURIToBlob(b64Data: string, contentType: string = '', sliceSize: number = 512): Blob | null {
    let blob: Blob | null = null;
    try {
      contentType = contentType || b64Data.split(',')[0].split(':')[1].split(';')[0];
      const base64Data = b64Data.split(',')[1];
      const byteCharacters = atob(base64Data);

      const len = byteCharacters.length;
      const byteArrays = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        byteArrays[i] = byteCharacters.charCodeAt(i);
      }

      try {
        blob = new Blob([byteArrays.buffer], { type: contentType });
      } catch (e: any) {
        // Handle legacy BlobBuilder fallback for older browsers
        const BlobBuilder = (window as any).BlobBuilder || (window as any).WebKitBlobBuilder || (window as any).MozBlobBuilder || (window as any).MSBlobBuilder;
        if (e.name == 'TypeError' && BlobBuilder) {
          const bb = new BlobBuilder();
          bb.append(byteArrays.buffer);
          blob = bb.getBlob(contentType);
        } else if (e.name == "InvalidStateError") {
          blob = new Blob([byteArrays.buffer], { type: contentType });
        } else {
          console.error("Blob unsupported entirely.");
        }
      }
    } catch (err) {
      throw err;
    }
    return blob;
  }

  private isBase64(str: string): boolean {
    try {
      return str != "" && btoa(atob(str)) == str;
    } catch {
      return false;
    }
  }

  private crossCheckFile(fileURL: string, callBack: (result: string) => void): void {

    (window as any).resolveLocalFileSystemURL(
      fileURL,
      (fileEntry: any) => {
        const win = (file: File) => {
          const reader = new FileReader();
          reader.onloadend = (evt: ProgressEvent<FileReader>) => {
            const result = evt.target?.result as string;
            const base64Data = result.split(',')[1];
            if (this.isBase64(base64Data)) {
              callBack(fileURL);
            } else {
              fileEntry.remove();
              callBack('');
            }
          };
          reader.readAsDataURL(file);
        };

        const fail = (error: any) => {
          throw "File entry failed -> crossCheckFile() -> commonService" + error;
        };

        fileEntry.file(win, fail);
      },
      (err: any) => { }
    );
  }

  saveFile(docObj: any, jobId: any): Promise<string> {
    return new Promise((resolve, reject) => {
      let fileName = docObj.FileName.split('.')[0] + '.txt';

      if (docObj.MIME === "application/pdf") {
        fileName = docObj.FileName.split('.')[0] + '.pdf';
      }

      const os = (window as any).os || {};
      if (os.wp) fileName = docObj.FileName;

      (window as any).requestFileSystem(
        (window as any).LocalFileSystem.PERSISTENT,
        0,
        (fileSystem: any) => {
          fileSystem.root.getDirectory(
            "SurveyorApp",
            { create: true },
            (dirEntry: any) => {
              dirEntry.getDirectory(
                jobId,
                { create: true },
                (subDirEntry: any) => {
                  subDirEntry.getFile(
                    fileName,
                    { create: true, exclusive: true },
                    (fileEntry: any) => {
                      fileEntry.createWriter((fileWriter: any) => {
                        fileWriter.onwriteend = () => {
                          resolve(fileEntry.nativeURL);
                        };

                        fileWriter.onerror = (e: any) => {
                          reject(`Write failed -> saveFile() -> commonService + ${JSON.stringify(e)}`);
                        };

                        try {
                          fileWriter.write(this.dataURIToBlob(docObj.FileBase64));
                        } catch (err) {
                          reject(`Error writing file -> saveFile() -> commonService + ${JSON.stringify(err)}`);
                        }
                      });
                    },
                    (error: any) => {
                      reject(`Get file error -> saveFile() -> commonService + ${JSON.stringify(error)}`);
                    }
                  );
                },
                (error: any) => {
                  reject(`Request sub-directory error -> saveFile() -> commonService + ${JSON.stringify(error)}`);
                }
              );
            },
            (error: any) => {
              reject(`Request directory error -> saveFile() -> commonService + ${JSON.stringify(error)}`);
            }
          );
        },
        (error: any) => {
          reject(`Request file system error -> saveFile() -> commonService + ${JSON.stringify(error)}`);
        }
      );
    });
  }

  returnBase64Image(fileURL: string): Promise<string> {
    return new Promise((resolve, reject) => {
      (window as any).resolveLocalFileSystemURL(
        fileURL,
        (fileEntry: any) => {
          fileEntry.file(
            (file: any) => {  // 👈 Fix: use any instead of File
              const reader = new FileReader();
              reader.onloadend = (evt: ProgressEvent<FileReader>) => {
                if (evt.target?.result) {
                  const result = evt.target.result as string;
                  const b64Data = `data:image/jpeg;base64,${result.split(',')[1]}`;
                  resolve(b64Data);
                } else {
                  reject("FileReader returned empty result -> returnBase64Image()");
                }
              };
              reader.onerror = (e) => {
                reject("FileReader error -> returnBase64Image() -> " + JSON.stringify(e));
              };
              reader.readAsDataURL(file);
            },
            (error: any) => {
              reject("File entry error -> returnBase64Image() -> " + JSON.stringify(error));
            }
          );
        },
        (err: any) => {
          reject("File not found in file system -> returnBase64Image() -> " + JSON.stringify(err));
        }
      );
    });
  }

  retrieveFile(filePath: string, callBack: (base64Data: string | null) => void): void {
    (window as any).resolveLocalFileSystemURL(
      filePath,
      (fileEntry: any) => {
        fileEntry.file(
          (file: File) => {
            const reader = new FileReader();

            reader.onloadend = (evt: ProgressEvent<FileReader>) => {
              if (evt.target?.result) {
                const base64Data = evt.target.result as string;
                callBack(base64Data);
              } else {
                throw new Error("Error reading file: Result is null");
              }
            };

            reader.onerror = (e: any) => {
              throw new Error("FileReader error in retrieveFile -> " + JSON.stringify(e));
            };

            reader.readAsDataURL(file);
          },
          (error: any) => {
            throw new Error("Error accessing file in retrieveFile -> " + JSON.stringify(error));
          }
        );
      },
      (error: any) => {
        throw new Error("Error resolving file path in retrieveFile -> " + JSON.stringify(error));
      }
    );
  }

  removeFile(filePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Resolving the file path
        (window as any).resolveLocalFileSystemURL(
          filePath,
          (entry: any) => {
            // Ensure the Entry is a FileEntry before removing
            const fileEntry = entry as unknown as FileEntry;
            fileEntry.remove(
              () => {
                resolve();
              },
              (err: any) => {
                // Throw error back to component
                reject(new Error("Error removing file -> removeFile() -> commonService: " + JSON.stringify(err)));
              }
            );
          },
          (err: any) => {
            // Throw error back to component
            reject(new Error("Error resolving file path -> removeFile() -> commonService: " + JSON.stringify(err)));
          }
        );
      } catch (err: any) {
        // Throw unexpected error back to component
        reject(new Error("Unexpected error -> removeFile() -> commonService: " + JSON.stringify(err)));
      }
    });
  }

  removeDirectory(dirName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Requesting the filesystem
        (window as any).requestFileSystem(
          (window as any).LocalFileSystem.PERSISTENT,
          0,
          (fileSystem: any) => {
            // Resolving the "SurveyorApp" directory
            fileSystem.root.getDirectory(
              "SurveyorApp",
              { create: false },
              (dirEntry: any) => {
                // Resolving the sub-directory with the provided name
                dirEntry.getDirectory(
                  dirName,
                  { create: false },
                  (subDirEntry: any) => {
                    // Removing the directory recursively
                    subDirEntry.removeRecursively(
                      () => {
                        resolve();
                      },
                      (err: any) => {
                        // Throw error back to component
                        reject(new Error(`Error removing directory '${dirName}': ${JSON.stringify(err)}`));
                      }
                    );
                  },
                  (err: any) => {
                    // Throw error back to component
                    reject(new Error(`Error resolving sub-directory '${dirName}': ${JSON.stringify(err)}`));
                  }
                );
              },
              (err: any) => {
                // Throw error back to component
                reject(new Error(`Error resolving directory 'SurveyorApp': ${JSON.stringify(err)}`));
              }
            );
          },
          (err: any) => {
            reject(new Error(`Error requesting file system: ${JSON.stringify(err)}`));
          }
        );
      } catch (err: any) {
        reject(new Error(`Unexpected error in removeDirectory: ${err.message || err}`));
      }
    });
  }

}
