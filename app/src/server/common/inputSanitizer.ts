import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

export function sanitizeInput(input: string): string {
  return purify.sanitize(input);
}

export function sanitizeData(data: Record<string, any>): Record<string, any> {
  const sanitizedData: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    sanitizedData[key] = typeof value === 'string' ? sanitizeInput(value) : value;
  }

  return sanitizedData;
}
