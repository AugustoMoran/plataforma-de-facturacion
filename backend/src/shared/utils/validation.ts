import { Types } from 'mongoose';
import { AppError } from '../../middleware/error.middleware';

/**
 * Validates a MongoDB ObjectId string and returns it.
 * Throws AppError 400 if invalid to prevent NoSQL injection via malformed IDs.
 */
export function validateObjectId(id: string, fieldName = 'id'): string {
  if (!id || typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}: must be a valid ObjectId`, 400);
  }
  // Additional check: isValid() accepts 12-char strings too, ensure 24-char hex
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new AppError(`Invalid ${fieldName}: must be a valid ObjectId`, 400);
  }
  return id;
}

/**
 * Sanitizes a string for use in MongoDB regex / text search.
 * Escapes special regex characters to prevent injection.
 */
export function sanitizeSearchString(input: string): string {
  if (typeof input !== 'string') return '';
  // Limit length
  const trimmed = input.trim().slice(0, 200);
  // Escape regex special characters
  return trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
