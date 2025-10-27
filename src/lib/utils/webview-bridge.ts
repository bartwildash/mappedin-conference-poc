/**
 * WebView Bridge - React Native Communication
 *
 * Provides bidirectional communication between this web app and React Native WebView.
 * Used for deep linking, navigation, and native feature integration.
 */

export interface WebViewMessage {
  type: string;
  payload?: any;
}

export interface ExhibitorSelectedMessage extends WebViewMessage {
  type: 'exhibitor:selected';
  payload: {
    externalId: string;
    name: string;
    boothNumber?: string;
    description?: string;
    website?: string;
  };
}

export interface NavigateToExhibitorMessage extends WebViewMessage {
  type: 'navigate:exhibitor';
  payload: {
    externalId: string;
  };
}

export interface BackToAppMessage extends WebViewMessage {
  type: 'navigation:back';
}

export interface MapReadyMessage extends WebViewMessage {
  type: 'map:ready';
}

/**
 * Check if running inside React Native WebView
 */
export function isReactNativeWebView(): boolean {
  return typeof window !== 'undefined' &&
         typeof (window as any).ReactNativeWebView !== 'undefined';
}

/**
 * Send message to React Native parent app
 */
export function postMessageToNative(message: WebViewMessage): void {
  if (!isReactNativeWebView()) {
    console.warn('[WebView Bridge] Not in React Native WebView, message not sent:', message);
    return;
  }

  try {
    const messageString = JSON.stringify(message);
    (window as any).ReactNativeWebView.postMessage(messageString);
    console.log('[WebView Bridge] Sent to native:', message);
  } catch (error) {
    console.error('[WebView Bridge] Failed to send message:', error);
  }
}

/**
 * Send exhibitor selection to native app
 */
export function notifyExhibitorSelected(exhibitor: {
  externalId: string;
  name: string;
  boothNumber?: string;
  description?: string;
  website?: string;
}): void {
  postMessageToNative({
    type: 'exhibitor:selected',
    payload: exhibitor
  });
}

/**
 * Notify native app that user wants to go back
 */
export function notifyBackToApp(): void {
  postMessageToNative({
    type: 'navigation:back'
  });
}

/**
 * Notify native app that map is ready
 */
export function notifyMapReady(): void {
  postMessageToNative({
    type: 'map:ready'
  });
}

/**
 * Register listener for messages from React Native
 */
export function onMessageFromNative(callback: (message: WebViewMessage) => void): () => void {
  const handler = (event: MessageEvent) => {
    try {
      // Parse message from React Native
      const message: WebViewMessage = typeof event.data === 'string'
        ? JSON.parse(event.data)
        : event.data;

      console.log('[WebView Bridge] Received from native:', message);
      callback(message);
    } catch (error) {
      console.error('[WebView Bridge] Failed to parse message:', error);
    }
  };

  // Listen on both window and document for cross-platform compatibility
  // iOS uses document.addEventListener, Android uses window.addEventListener
  window.addEventListener('message', handler);
  document.addEventListener('message', handler as any);

  // Return cleanup function
  return () => {
    window.removeEventListener('message', handler);
    document.removeEventListener('message', handler as any);
  };
}

/**
 * Initialize WebView bridge and return cleanup function
 */
export function initWebViewBridge(options: {
  onNavigateToExhibitor?: (externalId: string) => void;
  onThemeChange?: (theme: 'light' | 'dark') => void;
  onCustomAction?: (action: string, data: any) => void;
}): () => void {
  console.log('[WebView Bridge] Initializing...', {
    isWebView: isReactNativeWebView(),
    userAgent: navigator.userAgent
  });

  // Notify native that we're ready
  if (isReactNativeWebView()) {
    // Small delay to ensure WebView is fully loaded
    setTimeout(() => notifyMapReady(), 100);
  }

  // Register message listener
  const unsubscribe = onMessageFromNative((message) => {
    switch (message.type) {
      case 'navigate:exhibitor':
        if (options.onNavigateToExhibitor && message.payload?.externalId) {
          options.onNavigateToExhibitor(message.payload.externalId);
        }
        break;

      case 'theme:change':
        if (options.onThemeChange && message.payload?.theme) {
          options.onThemeChange(message.payload.theme);
        }
        break;

      case 'custom:action':
        if (options.onCustomAction && message.payload?.action) {
          options.onCustomAction(message.payload.action, message.payload.data);
        }
        break;

      default:
        console.warn('[WebView Bridge] Unknown message type:', message.type);
    }
  });

  return unsubscribe;
}
