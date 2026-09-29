import { sourceRepository } from '../db/sourceRepository';
import { priceRepository } from '../db/priceRepository';
import { DEFAULT_PRICE_SOURCES } from './sourcesConfig';
import { priceNormalizer } from './priceNormalizer';
import {
  NormalizedPrice,
  IngestionResult,
} from './types';

export class PriceIngestionService {
  public initializeSources(): void {
    for (const source of DEFAULT_PRICE_SOURCES) {
      sourceRepository.upsertSource(source);
    }
  }

  public async ingestPrices(
    rawPrices: NormalizedPrice[],
    options?: { sourceId?: string }
  ): Promise<IngestionResult> {
    const sourceId = options?.sourceId || rawPrices[0]?.sourceId || 'punjab-mandi-board';
    const source = sourceRepository.getSourceById(sourceId);
    const sourceName = source?.name || sourceId;

    let itemsInserted = 0;
    let itemsDuplicate = 0;

    for (const item of rawPrices) {
      const { record, error } = priceNormalizer.toRecord(item);
      if (!record || error) {
        continue;
      }

      const inserted = priceRepository.insertPrice(record);
      if (inserted) {
        itemsInserted++;
      } else {
        itemsDuplicate++;
      }
    }

    return {
      sourceId,
      sourceName,
      success: true,
      itemsFetched: rawPrices.length,
      itemsInserted,
      itemsDuplicate,
    };
  }
}

export const priceIngestionService = new PriceIngestionService();
