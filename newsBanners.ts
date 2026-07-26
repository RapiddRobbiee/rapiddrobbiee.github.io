export type NewsBannerType = 'info' | 'warning' | 'success' | 'announcement' | 'urgent';

export interface NewsBanner {
    id: string; // Unique identifier for localStorage tracking
    message: string; // Banner text content
    type: NewsBannerType; // Style variant
    startDate: string; // ISO date string - when to start showing
    endDate: string; // ISO date string - when to stop showing
    priority: number; // Display order (higher = shown first)
    link?: string; // Optional CTA link
    linkText?: string; // Optional CTA button text
    dismissible?: boolean; // Whether user can close it (default: true)
    centered?: boolean; // Whether text should be centered (default: false)
    showOnLoginScreen?: boolean; // Whether to show on login screen (default: false)
    onlyOnLogin?: boolean; // Whether to show ONLY on login screen (default: false)
}

// Configure your news banners here
export const newsBanners: NewsBanner[] = [
    // Development banner
    {
        id: 'dev-banner-2025',
        message: 'Dokkan Patch Maker is currently in development and not released to the public.',
        type: 'warning',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2026-12-31T23:59:59Z',
        priority: 100, // Highest priority to always show first
        dismissible: false, // Can't dismiss the dev banner
        centered: true, // Center the development message
        showOnLoginScreen: true, // Show on login screen
    },
    {
        id: '01',
        message: 'Dokkan has removed the is_usm column from the effect_packs table, you may need to regenerate your sql.',
        type: 'info',
        startDate: '2025-12-28T00:00:00Z',
        endDate: '2026-08-12T23:59:59Z',
        priority: 5,
        dismissible: true,
        centered: true,

    },
    {
        id: '02',
        message: 'Make sure to check the beta settings tab for new features.',
        type: 'announcement',
        startDate: '2025-12-28T00:00:00Z',
        endDate: '2026-09-12T23:59:59Z',
        priority: 15,
        dismissible: true,
        centered: true,

    },
    {
        id: 'dev-banner-login-2026',
        message: "Access to the app is strictly limited to authorized users.",
        type: 'urgent',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2026-12-31T23:59:59Z',
        priority: 99, // Highest priority to always show first
        dismissible: false, // Can't dismiss the dev banner
        centered: true, // Center the development message
        showOnLoginScreen: true, // Show on login screen
        onlyOnLogin: true, // Show only on login screen

    },
];

/**
 * Get all active banners based on current date and dismissed state
 */
export const getActiveBanners = (dismissedBannerIds: string[]): NewsBanner[] => {
    const now = new Date();

    return newsBanners
        .filter((banner) => {
            // Check if banner is within date range
            const start = new Date(banner.startDate);
            const end = new Date(banner.endDate);
            const isInDateRange = now >= start && now <= end;

            // Check if banner has been dismissed
            const isDismissed = dismissedBannerIds.includes(banner.id);

            return isInDateRange && !isDismissed;
        })
        .sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)
};

/**
 * Get dismissed banner IDs from localStorage
 */
export const getDismissedBannerIds = (): string[] => {
    try {
        const dismissed = localStorage.getItem('dismissedNewsBanners');
        return dismissed ? JSON.parse(dismissed) : [];
    } catch (e) {
        console.error('Error reading dismissed banners from localStorage:', e);
        return [];
    }
};

/**
 * Save dismissed banner ID to localStorage
 */
export const dismissBanner = (bannerId: string): void => {
    try {
        const dismissed = getDismissedBannerIds();
        if (!dismissed.includes(bannerId)) {
            dismissed.push(bannerId);
            localStorage.setItem('dismissedNewsBanners', JSON.stringify(dismissed));
        }
    } catch (e) {
        console.error('Error saving dismissed banner to localStorage:', e);
    }
};
