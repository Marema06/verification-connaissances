import { CanActivateFn } from '@angular/router';

export const qcmCompleteGuard: CanActivateFn = (route, state) => {
  return true;
};
