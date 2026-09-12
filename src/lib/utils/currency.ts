function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function convertAmount(
  amount: number,
  rate: number,
  from: 'USD' | 'CDF',
  to: 'USD' | 'CDF'
): number {
  // Si même devise, retourner le montant sans modification, mais appliquer l'arrondi correct pour normaliser.
  if (from === to) {
    return to === 'USD' ? roundToTwoDecimals(amount) : Math.round(amount);
  }

  // Conversion USD -> CDF
  if (from === 'USD' && to === 'CDF') {
    const raw = amount * rate;
    return Math.round(raw);
  }

  // Conversion CDF -> USD
  if (from === 'CDF' && to === 'USD') {
    const raw = amount / rate;
    return roundToTwoDecimals(raw);
  }

  throw new Error('Devises non prises en charge');
}

/**
 * Raccourci : convertit un montant USD en CDF (résultat entier).
 */
export function convertUsdToCdf(amountUsd: number, rate: number): number {
  return convertAmount(amountUsd, rate, 'USD', 'CDF');
}

/**
 * Raccourci : convertit un montant CDF en USD (2 décimales).
 */
export function convertCdfToUsd(amountCdf: number, rate: number): number {
  return convertAmount(amountCdf, rate, 'CDF', 'USD');
}

export function formatCurrency(amount: number, currency: 'USD' | 'CDF'): string {
  if (currency === 'CDF') {
    const rounded = Math.round(amount);
    const formattedNumber = rounded.toLocaleString('fr-FR', {
      maximumFractionDigits: 0,
      useGrouping: true,
    });
    return `${formattedNumber} FC`;
  } else {
    const rounded = roundToTwoDecimals(amount);
    const formattedNumber = rounded.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });
    return `${formattedNumber} $`;
  }
}