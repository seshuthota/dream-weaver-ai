import { describe, test, expect } from '@jest/globals';
import {
  calculateCost,
  estimateCost,
  formatCost,
  formatTime,
  extractJSON,
} from '../lib/utils';

describe('Cost Calculation Functions', () => {
  test('calculateCost should return correct numeric cost', () => {
    expect(calculateCost(1)).toBeCloseTo(0.07);
    expect(calculateCost(3)).toBeCloseTo(0.21);
    expect(calculateCost(10)).toBeCloseTo(0.70);
    expect(calculateCost(0)).toBe(0);
  });

  test('estimateCost should return formatted string', () => {
    expect(estimateCost(1)).toBe('$0.07');
    expect(estimateCost(3)).toBe('$0.21');
    expect(estimateCost(10)).toBe('$0.70');
    expect(estimateCost(0)).toBe('$0.00');
  });

  test('formatCost should format numbers correctly', () => {
    expect(formatCost(0.07)).toBe('$0.07');
    expect(formatCost(1.23)).toBe('$1.23');
    expect(formatCost(0)).toBe('$0.00');
    expect(formatCost(10.5)).toBe('$10.50');
  });
});

describe('Time Formatting', () => {
  test('formatTime should format seconds correctly', () => {
    expect(formatTime(0)).toBe('0s');
    expect(formatTime(30)).toBe('30s');
    expect(formatTime(59)).toBe('59s');
    expect(formatTime(60)).toBe('1m 0s');
    expect(formatTime(90)).toBe('1m 30s');
    expect(formatTime(125)).toBe('2m 5s');
    expect(formatTime(3600)).toBe('60m 0s');
  });
});

describe('JSON Extraction', () => {
  test('should extract JSON from code blocks', () => {
    const input1 = '```json\n{"name": "test"}\n```';
    expect(extractJSON(input1)).toEqual({ name: 'test' });

    const input2 = '```\n{"value": 123}\n```';
    expect(extractJSON(input2)).toEqual({ value: 123 });
  });

  test('should extract plain JSON', () => {
    const input = '{"foo": "bar"}';
    expect(extractJSON(input)).toEqual({ foo: 'bar' });
  });

  test('should extract JSON arrays', () => {
    const input = '[1, 2, 3]';
    expect(extractJSON(input)).toEqual([1, 2, 3]);
  });

  test('should extract embedded JSON', () => {
    const input = 'Here is some text {"key": "value"} and more text';
    expect(extractJSON(input)).toEqual({ key: 'value' });
  });

  test('should handle complex nested JSON', () => {
    const input = '```json\n{"user": {"name": "John", "age": 30}, "active": true}\n```';
    expect(extractJSON(input)).toEqual({
      user: { name: 'John', age: 30 },
      active: true,
    });
  });

  test('should throw error for invalid JSON', () => {
    const input = 'This is not JSON at all';
    expect(() => extractJSON(input)).toThrow('No JSON object or array found');
  });

  test('should throw error for malformed JSON', () => {
    const input = '{"invalid": JSON}';
    expect(() => extractJSON(input)).toThrow('Failed to parse JSON');
  });

  test('should handle extra whitespace', () => {
    const input = '  \n\n  {"trimmed": true}  \n\n  ';
    expect(extractJSON(input)).toEqual({ trimmed: true });
  });
});
