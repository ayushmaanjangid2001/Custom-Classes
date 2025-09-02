import { TestBed } from '@angular/core/testing';

import { PhotoDocsSizeService } from './photo-docs-size.service';

describe('PhotoDocsSizeService', () => {
  let service: PhotoDocsSizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhotoDocsSizeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
