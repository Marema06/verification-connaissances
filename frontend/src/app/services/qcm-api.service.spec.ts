import { TestBed } from '@angular/core/testing';

import { QcmApiService } from './qcm-api.service';

describe('QcmApiService', () => {
  let service: QcmApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QcmApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
