import { TestBed } from '@angular/core/testing';

import { DeviceinfoService } from './deviceinfo.service';

describe('DeviceinfoService', () => {
  let service: DeviceinfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceinfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
