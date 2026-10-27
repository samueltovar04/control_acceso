import { Pipe, PipeTransform, inject } from '@angular/core';
import { TasaCambioService } from '../../core/services/tasa-cambio.service';

@Pipe({
  name: 'bcvConvert',
  standalone: true,
  pure: false
})
export class BcvConvertPipe implements PipeTransform {
  private tasaService = inject(TasaCambioService);

  transform(amount: number | null | undefined, fromCurrency: 'USD' | 'EUR' = 'USD'): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'Bs. 0,00';
    }

    const rate = fromCurrency === 'USD' 
      ? this.tasaService.tasaUsdSignal() 
      : this.tasaService.tasaEurSignal();

    if (!rate || rate <= 0) {
      return 'Bs. ---';
    }

    const totalVes = Math.round((amount * rate + Number.EPSILON) * 100) / 100;
    const parts = totalVes.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Bs. ${integerPart},${parts[1]}`;
  }
}
