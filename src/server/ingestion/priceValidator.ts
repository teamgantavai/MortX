import { NormalizedPrice } from './types';

export interface PriceValidationResult {
  valid: boolean;
  error?: string;
  flaggedSuspicious?: boolean;
  suspicionReason?: string;
}

export class PriceValidator {
  private validUnits = new Set(['kg', 'gram', 'litre', 'dozen', 'piece', 'quintal']);

  // Typical realistic price ranges per kg/unit in INR for sanity detection
  private maxReasonableThresholds: Record<string, number> = {
    tomato: 350,
    onion: 250,
    potato: 150,
    wheat: 6000, // per quintal
    rice: 12000, // per quintal
    milk: 150,   // per litre
    cauliflower: 200,
    garlic: 600,
    ginger: 500,
  };

  public validate(item: Partial<NormalizedPrice>): PriceValidationResult {
    // 1. Mandatory product
    if (!item.productName || typeof item.productName !== 'string' || item.productName.trim().length === 0) {
      return { valid: false, error: 'Product name is required' };
    }

    // 2. Mandatory price > 0
    if (typeof item.price !== 'number' || isNaN(item.price) || item.price <= 0) {
      return { valid: false, error: `Invalid price value: ${item.price}. Price must be greater than zero.` };
    }

    // 3. Mandatory and valid unit
    if (!item.unit || typeof item.unit !== 'string' || item.unit.trim().length === 0) {
      return { valid: false, error: 'Measurement unit is required' };
    }

    const unitLower = item.unit.toLowerCase().trim();
    if (!this.validUnits.has(unitLower)) {
      return { valid: false, error: `Unsupported unit: '${item.unit}'. Must be one of kg, gram, litre, dozen, piece, quintal.` };
    }

    // 4. Currency
    if (item.currency && item.currency.toUpperCase() !== 'INR') {
      return { valid: false, error: `Invalid currency: '${item.currency}'. Currently only INR is supported.` };
    }

    // 5. Market / Source
    if (!item.market || item.market.trim().length === 0) {
      return { valid: false, error: 'Market or venue name is required' };
    }

    // 6. Observation timestamp
    if (!item.observedAt || isNaN(new Date(item.observedAt).getTime())) {
      return { valid: false, error: 'Valid observation timestamp (ISO 8601) is required' };
    }

    // 7. Sanity Check for Suspicious Values (flag for review without silently deleting)
    const productKey = item.productName.toLowerCase().trim();
    const threshold = this.maxReasonableThresholds[productKey];
    if (threshold && item.price > threshold) {
      return {
        valid: true,
        flaggedSuspicious: true,
        suspicionReason: `Unusually high price (${item.price} INR/${unitLower}) for ${item.productName}. Normal threshold is <= ${threshold}.`,
      };
    }

    return { valid: true };
  }
}

export const priceValidator = new PriceValidator();
