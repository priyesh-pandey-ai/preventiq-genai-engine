// Google Analytics utility functions
// This module provides a clean API for tracking events across the application

declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
  }
}

export const analytics = {
  // Track page views
  pageView: (url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: url,
      });
    }
  },

  // Track custom events
  event: (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  },

  // Specific tracking methods for common actions
  trackCTA: (label: string, location: string) => {
    analytics.event('cta_click', {
      event_category: 'engagement',
      event_label: label,
      location: location,
    });
  },

  trackFormSubmit: (formType: string, success: boolean) => {
    analytics.event('form_submit', {
      event_category: 'conversion',
      form_type: formType,
      success: success,
    });
  },

  trackWidgetUse: (category: string, success: boolean) => {
    analytics.event('widget_use', {
      event_category: 'engagement',
      campaign_category: category,
      success: success,
    });
  },

  trackLogin: (method: 'signup' | 'signin', success: boolean) => {
    analytics.event(method === 'signup' ? 'sign_up' : 'login', {
      event_category: 'authentication',
      method: 'email',
      success: success,
    });
  },

  trackNavigation: (linkName: string) => {
    analytics.event('navigation_click', {
      event_category: 'engagement',
      link_name: linkName,
    });
  },
};
