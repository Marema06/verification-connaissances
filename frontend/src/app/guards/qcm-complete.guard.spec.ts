import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { qcmCompleteGuard } from './qcm-complete.guard';

describe('qcmCompleteGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => qcmCompleteGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
