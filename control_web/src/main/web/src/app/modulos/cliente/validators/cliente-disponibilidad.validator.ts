import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

export class ClienteValidators {
  static validarCedulaUnica(http: HttpClient): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.trim().length < 4) {
        return of(null);
      }
      return timer(350).pipe(
        switchMap(() => http.get<any>(`/api/clientes/validar-disponibilidad?cedula=${encodeURIComponent(control.value.trim())}`)),
        map(res => (!res.cedulaDisponible ? { cedulaDuplicada: true, mensaje: res.mensaje } : null)),
        catchError(() => of(null))
      );
    };
  }

  static validarCorreoUnico(http: HttpClient): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || !control.value.includes('@')) {
        return of(null);
      }
      return timer(350).pipe(
        switchMap(() => http.get<any>(`/api/clientes/validar-disponibilidad?correo=${encodeURIComponent(control.value.trim())}`)),
        map(res => (!res.correoDisponible ? { correoDuplicado: true, mensaje: res.mensaje } : null)),
        catchError(() => of(null))
      );
    };
  }
}
