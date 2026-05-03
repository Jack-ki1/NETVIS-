import { describe, it, expect } from 'vitest';
import { rng, clamp, sigmoid, hexToRgb, genTrainData } from './utils';

describe('Utility Functions', () => {
  describe('rng', () => {
    it('generates consistent numbers for same seed', () => {
      const g1 = rng(12345);
      const g2 = rng(12345);
      expect(g1()).toBe(g2());
      expect(g1()).toBe(g2());
    });

    it('generates pseudo-random values', () => {
      const g = rng(1);
      const v1 = g();
      const v2 = g();
      expect(v1).not.toBe(v2);
      expect(v1).toBeGreaterThanOrEqual(0);
      expect(v1).toBeLessThanOrEqual(1);
    });
  });

  describe('clamp', () => {
    it('clamps values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('sigmoid', () => {
    it('calculates sigmoid correctly', () => {
      expect(sigmoid(0)).toBe(0.5);
      expect(sigmoid(100)).toBeCloseTo(1, 5);
      expect(sigmoid(-100)).toBeCloseTo(0, 5);
    });
  });

  describe('hexToRgb', () => {
    it('converts hex to rgb array', () => {
      expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
      expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
    });
  });

  describe('genTrainData', () => {
    it('generates specified number of points', () => {
      const data = genTrainData(10);
      expect(data).toHaveLength(10);
      expect(data[0]).toHaveProperty('epoch');
      expect(data[0]).toHaveProperty('loss');
    });

    it('applies hyperparameter influences', () => {
      const dataLow = genTrainData(10, 1, { 'Learning Rate': -5 });
      const dataHigh = genTrainData(10, 1, { 'Learning Rate': -1 });
      // High learning rate should decay faster or behave differently influenced by logic
      expect(dataLow[9].loss).not.toBe(dataHigh[9].loss);
    });
  });
});
