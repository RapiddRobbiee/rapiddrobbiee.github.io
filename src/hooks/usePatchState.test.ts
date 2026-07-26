import { renderHook, act } from '@testing-library/react';

import { describe, it, expect } from 'vitest';
import { usePatchState } from '../../hooks/usePatchState';
import { INITIAL_CARD_FORM } from '../../constants';

describe('usePatchState', () => {
    it('should initialize with default state', () => {
        const { result } = renderHook(() => usePatchState());

        expect(result.current.patchState.cardForms).toHaveLength(1); // Initial state has 1 card form
        expect(result.current.patchState.cardUniqueInfos).toHaveLength(0);
    });

    it('should update patch state', () => {
        const { result } = renderHook(() => usePatchState());

        const newCard = INITIAL_CARD_FORM();
        newCard.id = 'test_card_1';

        act(() => {
            result.current.setPatchState((prevState) => ({
                ...prevState,
                cardForms: [newCard],
            }));
        });

        expect(result.current.patchState.cardForms).toHaveLength(1);
        expect(result.current.patchState.cardForms[0].id).toBe('test_card_1');
    });

    it('should reset patch state', () => {
        const { result } = renderHook(() => usePatchState());

        const newCard = INITIAL_CARD_FORM();
        newCard.id = 'test_card_1';

        act(() => {
            result.current.setPatchState((prevState) => ({
                ...prevState,
                cardForms: [newCard],
            }));
        });

        expect(result.current.patchState.cardForms).toHaveLength(1);

        act(() => {
            result.current.resetPatchState();
        });

        expect(result.current.patchState.cardForms).toHaveLength(1); // Reset state has 1 initial card form
    });
});
