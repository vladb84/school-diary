/**
 * Маска времени HH:MM — принимает только цифры, автоматически вставляет ':'
 * Если первая цифра > 2, час считается однозначным:
 *   "900"  → "09:00"
 *   "1700" → "17:00"
 */
export const maskTime = raw => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (!digits) return '';
  if (digits[0] > '2' && digits.length >= 2) {
    const padded = '0' + digits[0] + digits.slice(1);
    return padded.slice(0, 2) + ':' + padded.slice(2, 4);
  }
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ':' + digits.slice(2);
};
