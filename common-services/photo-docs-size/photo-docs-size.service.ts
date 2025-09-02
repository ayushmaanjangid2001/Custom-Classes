import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PhotoDocsSizeService {

  constructor() { }

  /**
   * Init the quality and targetSize of the both photo and document
   */
  public size = {
    photo: {
      quality: 0,
      targetSize: 0
    },
    docs: {
      quality: 0,
      targetSize: 0
    }
  }
}
