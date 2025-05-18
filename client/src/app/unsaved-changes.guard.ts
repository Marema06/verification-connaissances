// src/app/unsaved-changes.guard.ts
import { CanDeactivateFn } from '@angular/router';
import { QcmFormComponent } from './qcm-form/qcm-form.component';

export const unsavedChangesGuard: CanDeactivateFn<QcmFormComponent> = (component, currentRoute, currentState, nextState) => {
  if (!component.formSubmitted) {
    return confirm('Tu n’as pas terminé le QCM. Es-tu sûr de vouloir quitter ?');
  }
  return true;
};
