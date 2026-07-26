import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../App';
import { AppProvider } from '../context/AppContext';

describe('App', () => {
    it('renders without crashing', () => {
        render(
            <AppProvider>
                <App />
            </AppProvider>
        );
        // Since the app might show a loading state or login screen depending on auth,
        // we just check if the document body exists for now as a basic smoke test.
        // A more specific test would depend on the initial state.
        expect(document.body).toBeInTheDocument();
    });
});
