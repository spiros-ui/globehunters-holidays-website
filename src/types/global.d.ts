// Global type declarations

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
    fbq: (
      command: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

export {};
