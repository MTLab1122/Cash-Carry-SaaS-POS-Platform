import { Injectable, BadRequestException } from '@nestjs/common';
import { calculateEan13CheckDigit, isValidEan13, generateInternalEan13, formatCode128 } from '@cash-carry/shared';

@Injectable()
export class BarcodeService {
  generateEan13(productIdNumber: number): string {
    return generateInternalEan13(productIdNumber);
  }

  validateBarcode(barcode: string, type: 'EAN13' | 'CODE128' = 'EAN13'): { valid: boolean; reason?: string } {
    if (type === 'EAN13') {
      if (!/^\d{13}$/.test(barcode)) {
        return { valid: false, reason: 'EAN-13 must be exactly 13 digits' };
      }
      const valid = isValidEan13(barcode);
      return { valid, reason: valid ? undefined : 'Invalid EAN-13 check digit' };
    }
    return { valid: barcode.length > 0 };
  }

  generateLabelTemplate(params: {
    productName: string;
    barcode: string;
    sku: string;
    retailPrice: number;
    currency: string;
    companyName: string;
    widthMm?: number;
    heightMm?: number;
  }) {
    const {
      productName,
      barcode,
      sku,
      retailPrice,
      currency = 'PKR',
      companyName,
      widthMm = 50,
      heightMm = 30,
    } = params;

    // Returns printable SVG/HTML payload for thermal label printers (TSC, Xprinter, Zebra)
    return {
      widthMm,
      heightMm,
      barcode,
      sku,
      productName,
      priceFormatted: `${currency} ${retailPrice.toLocaleString()}`,
      companyName,
      svg: `<svg width="${widthMm}mm" height="${heightMm}mm" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <style>
          .header { font-size: 10px; font-weight: bold; text-anchor: middle; fill: #111; }
          .title { font-size: 12px; font-weight: bold; text-anchor: middle; fill: #000; }
          .price { font-size: 14px; font-weight: 800; text-anchor: middle; fill: #000; }
          .barcode-num { font-size: 9px; font-family: monospace; text-anchor: middle; letter-spacing: 2px; }
        </style>
        <rect width="200" height="120" fill="white" stroke="#ddd" />
        <text x="100" y="16" class="header">${companyName}</text>
        <text x="100" y="32" class="title">${productName.substring(0, 24)}</text>
        <!-- Barcode representation -->
        <rect x="25" y="40" width="3" height="42" fill="black"/>
        <rect x="31" y="40" width="2" height="42" fill="black"/>
        <rect x="36" y="40" width="4" height="42" fill="black"/>
        <rect x="44" y="40" width="2" height="42" fill="black"/>
        <rect x="50" y="40" width="5" height="42" fill="black"/>
        <rect x="60" y="40" width="2" height="42" fill="black"/>
        <rect x="65" y="40" width="3" height="42" fill="black"/>
        <rect x="72" y="40" width="4" height="42" fill="black"/>
        <rect x="80" y="40" width="2" height="42" fill="black"/>
        <rect x="86" y="40" width="4" height="42" fill="black"/>
        <rect x="94" y="40" width="3" height="42" fill="black"/>
        <rect x="102" y="40" width="5" height="42" fill="black"/>
        <rect x="112" y="40" width="2" height="42" fill="black"/>
        <rect x="118" y="40" width="4" height="42" fill="black"/>
        <rect x="126" y="40" width="2" height="42" fill="black"/>
        <rect x="132" y="40" width="3" height="42" fill="black"/>
        <rect x="140" y="40" width="4" height="42" fill="black"/>
        <rect x="148" y="40" width="2" height="42" fill="black"/>
        <rect x="154" y="40" width="5" height="42" fill="black"/>
        <rect x="164" y="40" width="3" height="42" fill="black"/>
        <rect x="171" y="40" width="2" height="42" fill="black"/>
        <text x="100" y="93" class="barcode-num">${barcode}</text>
        <text x="100" y="112" class="price">${currency} ${retailPrice.toLocaleString()}</text>
      </svg>`,
    };
  }
}

