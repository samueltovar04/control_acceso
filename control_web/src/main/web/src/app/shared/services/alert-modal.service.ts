import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertModalOptions {
  id?: string;
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class AlertModalService {
  private alertSubject = new BehaviorSubject<AlertModalOptions | null>(null);
  public alert$: Observable<AlertModalOptions | null> = this.alertSubject.asObservable();

  show(options: AlertModalOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.alertSubject.next({
        ...options,
        onConfirm: () => {
          this.close();
          if (options.onConfirm) options.onConfirm();
          resolve(true);
        },
        onCancel: () => {
          this.close();
          if (options.onCancel) options.onCancel();
          resolve(false);
        }
      });
    });
  }

  success(message: string, title: string = 'Operacion Exitosa'): Promise<boolean> {
    return this.show({
      type: 'success',
      title,
      message,
      confirmText: 'Aceptar',
      showCancel: false
    });
  }

  error(message: string, title: string = 'Error'): Promise<boolean> {
    return this.show({
      type: 'error',
      title,
      message,
      confirmText: 'Entendido',
      showCancel: false
    });
  }

  warning(message: string, title: string = 'Atencion'): Promise<boolean> {
    return this.show({
      type: 'warning',
      title,
      message,
      confirmText: 'Aceptar',
      showCancel: false
    });
  }

  info(message: string, title: string = 'Informacion'): Promise<boolean> {
    return this.show({
      type: 'info',
      title,
      message,
      confirmText: 'Aceptar',
      showCancel: false
    });
  }

  confirm(message: string, title: string = 'Confirmar Accion', confirmText: string = 'Si, confirmar', cancelText: string = 'Cancelar'): Promise<boolean> {
    return this.show({
      type: 'warning',
      title,
      message,
      confirmText,
      cancelText,
      showCancel: true
    });
  }

  close(): void {
    this.alertSubject.next(null);
  }
}
