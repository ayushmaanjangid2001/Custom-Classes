import { TestBed } from '@angular/core/testing';

import { SurveyorapiService } from './surveyorapi.service';

describe('SurveyorapiService', () => {
  let service: SurveyorapiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SurveyorapiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
