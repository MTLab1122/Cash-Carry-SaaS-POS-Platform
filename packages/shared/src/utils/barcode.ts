/**
 * Calculates EAN-13 Check Digit
 * Standard GS1 Modulo 10 algorithm
 */
export function calculateEan13CheckDigit(twelveDigits: string): number {
  if (!/^\d{12}$/.test(twelveDigits)) {
    throw new Error('Input must be exactly 12 digits');
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(twelveDigits[i], 10);
    // Even index (0-based) has weight 1, odd index has weight 3
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Validates EAN-13 Barcode
 */
export function isValidEan13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) return false;
  const twelveDigits = barcode.substring(0, 12);
  const expectedCheckDigit = calculateEan13CheckDigit(twelveDigits);
  return parseInt(barcode[12], 10) === expectedCheckDigit;
}

/**
 * Generates an internal store-safe EAN-13 barcode
 * Prefix '200' to '299' are officially designated for internal store use (in-store barcodes)
 * and won't collide with manufacturer GS1 barcodes.
 */
export function generateInternalEan13(productIdNumber: number): string {
  const prefix = '200'; // GS1 reserved for in-store use
  const padded = productIdNumber.toString().padStart(9, '0').slice(-9);
  const twelve = prefix + padded;
  const checkDigit = calculateEan13CheckDigit(twelve);
  return `${twelve}${checkDigit}`;
}

/**
 * Formats a SKU into a clean barcode-compatible string (Code 128)
 */
export function formatCode128(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9\-_.]/g, '');
}
