export const CURRENCIES = {
  KRW: { code: 'KRW', name: '원화 (₩)', unit: '원', locale: 'ko-KR' },
  JPY: { code: 'JPY', name: '엔화 (¥)', unit: '엔', locale: 'ja-JP' },
};

export const formatCurrency = (amount, currencyCode = 'KRW') => {
  const c = CURRENCIES[currencyCode] || CURRENCIES.KRW;
  if (amount == null) return `0${c.unit}`;
  return `${amount.toLocaleString(c.locale)}${c.unit}`;
};

export const getCurrencyUnit = (currencyCode = 'KRW') => {
  return (CURRENCIES[currencyCode] || CURRENCIES.KRW).unit;
};
