import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertModalService, AlertModalOptions } from '../../services/alert-modal.service';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="alertModalService.alert$ | async as alert" 
         class="custom-alert-overlay"
         (click)="onBackdropClick($event, alert)">
      <div class="custom-alert-card animate-pop" (click)="$event.stopPropagation()">
        
        <!-- Header / Icon -->
        <div class="text-center mb-3">
          <div [ngClass]="getIconContainerClass(alert.type)" class="icon-circle shadow-sm">
            <i [ngClass]="getIconClass(alert.type)" class="bi"></i>
          </div>
          <h4 class="alert-title mt-3 mb-1">{{ alert.title || getDefaultTitle(alert.type) }}</h4>
        </div>

        <!-- Body -->
        <div class="alert-body text-center mb-4">
          <p class="mb-0 text-muted">{{ alert.message }}</p>
        </div>

        <!-- Actions -->
        <div class="d-flex justify-content-center gap-2">
          <button *ngIf="alert.showCancel" 
                  type="button" 
                  class="btn btn-light px-4 py-2 text-secondary fw-semibold border"
                  (click)="alert.onCancel && alert.onCancel()">
            {{ alert.cancelText || 'Cancelar' }}
          </button>
          
          <button type="button" 
                  [ngClass]="getConfirmBtnClass(alert.type)"
                  class="btn px-4 py-2 fw-semibold shadow-sm"
                  (click)="alert.onConfirm && alert.onConfirm()">
            {{ alert.confirmText || 'Aceptar' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .custom-alert-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 10500;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.15s ease-out;
    }

    .custom-alert-card {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 440px;
      padding: 2rem 1.75rem 1.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(226, 232, 240, 0.8);
    }

    .animate-pop {
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }

    .icon-success {
      background-color: #dcfce7;
      color: #16a34a;
    }

    .icon-error {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .icon-warning {
      background-color: #fef3c7;
      color: #d97706;
    }

    .icon-info {
      background-color: #e0f2fe;
      color: #0284c7;
    }

    .alert-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
    }

    .alert-body p {
      font-size: 0.95rem;
      line-height: 1.5;
      word-break: break-word;
      color: #475569;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes popIn {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class AlertModalComponent {
  public alertModalService = inject(AlertModalService);

  onBackdropClick(event: MouseEvent, alert: AlertModalOptions): void {
    if (!alert.showCancel && alert.onConfirm) {
      alert.onConfirm();
    } else if (alert.showCancel && alert.onCancel) {
      alert.onCancel();
    }
  }

  getIconContainerClass(type?: string): string {
    switch (type) {
      case 'success': return 'icon-success';
      case 'error': return 'icon-error';
      case 'warning': return 'icon-warning';
      case 'info':
      default: return 'icon-info';
    }
  }

  getIconClass(type?: string): string {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-x-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'info':
      default: return 'bi-info-circle-fill';
    }
  }

  getConfirmBtnClass(type?: string): string {
    switch (type) {
      case 'success': return 'btn-success';
      case 'error': return 'btn-danger';
      case 'warning': return 'btn-warning text-dark';
      case 'info':
      default: return 'btn-primary';
    }
  }

  getDefaultTitle(type?: string): string {
    switch (type) {
      case 'success': return 'Completado';
      case 'error': return 'Error';
      case 'warning': return 'Atencion';
      case 'info':
      default: return 'Informacion';
    }
  }
}
