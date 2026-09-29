import crypto from 'node:crypto';
import { NormalizedPrice, PriceCategory, PriceObservationRecord, PriceUnit } from './types';
import { priceValidator } from './priceValidator';

export class PriceNormalizer {
  public normalizeUnit(unitRaw?: string): PriceUnit {
    if (!unitRaw) return 'kg';
    const lower = unitRaw.toLowerCase().trim();

    if (/^(?:kg|kgs|kilogram|kilograms)$/.test(lower)) return 'kg';
    if (/^(?:gram|grams|gm|gms|g)$/.test(lower)) return 'gram';
    if (/^(?:litre|liter|litres|liters|ltr|ltrs|l)$/.test(lower)) return 'litre';
    if (/^(?:dozen|dozens|dz)$/.test(lower)) return 'dozen';
    if (/^(?:piece|pieces|pc|pcs)$/.test(lower)) return 'piece';
    if (/^(?:quintal|quintals|qtl|qtls)$/.test(lower)) return 'quintal';

    return 'kg';
  }

  public normalizeProductName(nameRaw: string): string {
    let clean = nameRaw.trim();
    // Normalize plural and common market variations
    const lower = clean.toLowerCase();
    if (lower.startsWith('tomato')) return 'Tomato';
    if (lower.startsWith('onion')) return 'Onion';
    if (lower.startsWith('potato')) return 'Potato';
    if (lower.startsWith('wheat')) return 'Wheat';
    if (lower.startsWith('rice')) return 'Rice';
    if (lower.startsWith('cauliflower')) return 'Cauliflower';
    if (lower.startsWith('ginger')) return 'Ginger';
    if (lower.startsWith('garlic')) return 'Garlic';
    if (lower.startsWith('milk')) return 'Milk';

    // Capitalize first letter
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  public detectCategory(productName: string): PriceCategory {
    const lower = productName.toLowerCase();
    if (/^(?:tomato|onion|potato|cauliflower|cabbage|carrot|peas|garlic|ginger|spinach|vegetable)/.test(lower)) {
      return 'VEGETABLE';
    }
    if (/^(?:apple|banana|mango|orange|guava|papaya|grapes|fruit)/.test(lower)) {
      return 'FRUIT';
    }
    if (/^(?:wheat|rice|maize|barley|bajra|grain)/.test(lower)) {
      return 'GRAIN';
    }
    if (/^(?:diesel|petrol|cng|lpg|fuel)/.test(lower)) {
      return 'FUEL';
    }
    if (/^(?:milk|oil|sugar|salt|dal|pulses)/.test(lower)) {
      return 'GROCERY';
    }
    return 'COMMODITY';
  }

  public generateContentHash(product: string, market: string, unit: string, observedAt: string): string {
    const day = observedAt ? observedAt.slice(0, 10) : '';
    const raw = `${product.toLowerCase().trim()}|${market.toLowerCase().trim()}|${unit.toLowerCase().trim()}|${day}`;
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
  }

  public toRecord(item: NormalizedPrice): { record: PriceObservationRecord | null; error?: string } {
    const validation = priceValidator.validate(item);
    if (!validation.valid) {
      return { record: null, error: validation.error };
    }

    const normProduct = this.normalizeProductName(item.productName);
    const normUnit = this.normalizeUnit(item.unit);
    const category = item.category || this.detectCategory(normProduct);
    const contentHash = this.generateContentHash(normProduct, item.market, normUnit, item.observedAt);
    const now = new Date().toISOString();

    const record: PriceObservationRecord = {
      id: `price-${contentHash.slice(0, 12)}`,
      productName: normProduct,
      category,
      price: Number(item.price.toFixed(2)),
      unit: normUnit,
      currency: (item.currency || 'INR').toUpperCase(),
      market: item.market.trim(),
      locationName: item.locationName.trim(),
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      observedAt: item.observedAt,
      sourceId: item.sourceId,
      sourceUrl: item.sourceUrl ?? null,
      contentHash,
      status: validation.flaggedSuspicious ? 'flagged' : 'active',
      createdAt: now,
      updatedAt: now,
    };

    return { record };
  }
}

export const priceNormalizer = new PriceNormalizer();
