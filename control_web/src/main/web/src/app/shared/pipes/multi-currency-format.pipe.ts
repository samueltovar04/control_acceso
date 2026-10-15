import { Pipe, PipeTransform } from '@angular/core';

export type CurrencyType = 'USD' | 'EUR' | 'VES';
export type DisplayMode = 'simultaneous' | 'single';

@Pipe({
  name: 'multiCurrency',
  standalone: true,
  pure: true
})
export class MultiCurrencyFormatPipe implements PipeTransform {

  transform(
    amount: number | string | null | undefined,
    fromCurrency: CurrencyType = 'USD',
    exchangeRate?: number | null,
    targetCurrency: CurrencyType = 'VES',
    displayMode: DisplayMode = 'simultaneous'
  ): string {
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
      return '---';
    }

    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const baseFormatted = this.formatCurrency(numericAmount, fromCurrency);

    if (displayMode === 'single') {
      return baseFormatted;
    }

    if (fromCurrency === targetCurrency || !exchangeRate || exchangeRate <= 0) {
      return baseFormatted;
    }

    let convertedAmount = 0;
    if (fromCurrency === 'USD' || fromCurrency === 'EUR') {
      convertedAmount = numericAmount * exchangeRate;
    } else if (fromCurrency === 'VES' && targetCurrency !== 'VES') {
      convertedAmount = numericAmount / exchangeRate;
    }

    const convertedFormatted = this.formatCurrency(convertedAmount, targetCurrency);
    return `${baseFormatted} | ${convertedFormatted}`;
  }

  private formatCurrency(value: number, currency: CurrencyType): string {
    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;

    switch (currency) {
      case 'USD':
        return `$ ${this.formatNumber(rounded, ',', '.')}`;
      case 'EUR':
        return `€ ${this.formatNumber(rounded, '.', ',')}`;
      case 'VES':
        return `Bs. ${this.formatNumber(rounded, '.', ',')}`;
      default:
        return `${rounded.toFixed(2)}`;
    }
  }

  private formatNumber(value: number, thousandSeparator: string, decimalSeparator: string): string {
    const parts = value.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    const decimalPart = parts[1];
    return `${integerPart}${decimalSeparator}${decimalPart}`;
  }
}
