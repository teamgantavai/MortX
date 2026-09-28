import { config } from '../config';
import { validateCoordinates } from '../retrieval/geoUtils';

export interface ValidationErrorResult {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export class InputValidator {
  public validateQueryInput(body: any): ValidationErrorResult {
    if (!body || typeof body !== 'object') {
      return {
        valid: false,
        errorCode: 'INVALID_REQUEST_BODY',
        errorMessage: 'Request body must be a valid JSON object',
      };
    }

    if (!body.query || typeof body.query !== 'string' || !body.query.trim()) {
      return {
        valid: false,
        errorCode: 'MISSING_QUERY',
        errorMessage: 'The "query" parameter is required and cannot be empty',
      };
    }

    if (body.query.length > config.maxQueryLength) {
      return {
        valid: false,
        errorCode: 'QUERY_TOO_LONG',
        errorMessage: `Query exceeds maximum allowed length of ${config.maxQueryLength} characters`,
      };
    }

    const coords = body.location || body.userLocation;
    if (coords) {
      const coordValidation = validateCoordinates(coords.latitude, coords.longitude);
      if (!coordValidation.valid) {
        return {
          valid: false,
          errorCode: 'INVALID_COORDINATES',
          errorMessage: coordValidation.error,
        };
      }

      if (coords.radiusKm !== undefined) {
        const radius = Number(coords.radiusKm);
        if (isNaN(radius) || radius <= 0 || radius > 100) {
          return {
            valid: false,
            errorCode: 'INVALID_RADIUS',
            errorMessage: 'Search radius must be a positive number up to 100 km',
          };
        }
      }
    }

    return { valid: true };
  }
}

export const inputValidator = new InputValidator();
