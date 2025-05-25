// src/app/guards/pending-changes.guard.ts
import { Injectable } from '@angular/core';
import {
  CanDeactivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';

export interface ComponentCanDeactivate {
  hasUnsavedChanges(): boolean;
}

@Injectable({ providedIn: 'root' })
export class PendingChangesGuard
  implements CanDeactivate<ComponentCanDeactivate>
{
  canDeactivate(
    component: ComponentCanDeactivate,
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    if (component.hasUnsavedChanges()) {
      return window.confirm(
        'Vous n’avez pas encore soumis votre QCM. Voulez-vous vraiment quitter ?'
      );
    }
    return true;
  }
}
