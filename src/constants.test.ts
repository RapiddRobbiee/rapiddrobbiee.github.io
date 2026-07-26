import { describe, it, expect } from 'vitest';
import { generateLocalId, isLocallyGeneratedId } from '../constants';

describe('constants utilities', () => {
    describe('generateLocalId', () => {
        it('should generate a string ID', () => {
            const id = generateLocalId();
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });

        it('should generate unique IDs', () => {
            const id1 = generateLocalId();
            const id2 = generateLocalId();
            expect(id1).not.toBe(id2);
        });
    });

    describe('isLocallyGeneratedId', () => {
        it('should return true for IDs in the local range', () => {
            expect(isLocallyGeneratedId('1900000')).toBe(true);
            expect(isLocallyGeneratedId('1999999')).toBe(true);
        });

        it('should return true for IDs with valid prefixes and local range suffix', () => {
            expect(isLocallyGeneratedId('bp_1900000')).toBe(true);
        });

        it('should return false for IDs outside the local range', () => {
            expect(isLocallyGeneratedId('100')).toBe(false);
            expect(isLocallyGeneratedId('2000000')).toBe(false);
        });

        it('should return false for invalid formats', () => {
            expect(isLocallyGeneratedId('')).toBe(false);
            expect(isLocallyGeneratedId('local_123')).toBe(false); // "local_" is not a valid prefix
            expect(isLocallyGeneratedId('bp_100')).toBe(false); // suffix not in range
        });
    });
});
