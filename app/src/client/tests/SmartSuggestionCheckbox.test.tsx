import { test, expect, vi } from 'vitest';

import { handlePrintSelected } from '../components/SmartSuggestionCheckbox';

test('Smart suggestions handlePrintSelected with multiple choices', () => {
  const spy = vi.fn();
  const expected = `Let's proceed with the following choices:
- item1
- item2`;
  handlePrintSelected(['item1', 'item2'], spy);
  expect(spy).toHaveBeenCalledWith(expected);
});

test('Smart suggestions handlePrintSelected with single choice', () => {
  const spy = vi.fn();
  const expected = `Let's proceed with the following choice:
- item1`;
  handlePrintSelected(['item1'], spy);
  expect(spy).toHaveBeenCalledWith(expected);
});

test('Smart suggestions handlePrintSelected with empty suggestions', () => {
  const spy = vi.fn();
  handlePrintSelected([], spy);
  expect(spy).not.toHaveBeenCalled();
});
