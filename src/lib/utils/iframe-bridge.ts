/**
 * Iframe Bridge - Responsive Embedding Communication
 *
 * Provides communication between this web app and parent page when embedded in iframe.
 * Handles responsive sizing, navigation, and cross-origin messaging.
 */

export interface IframeMessage {
  type: string;
  source: 'mappedin-conference-map';
  payload?: any;
}

export interface HeightUpdateMessage extends IframeMessage {
  type: 'iframe:height';
  payload: {
    height: number;
    scrollHeight: number;
  };
}

export interface ExhibitorClickedMessage extends IframeMessage {
  type: 'exhibitor:clicked';
  payload: {
    externalId: string;
    name: string;
    boothNumber?: string;
  };
}

/**
 * Check if running inside an iframe
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    // Cross-origin iframe will throw error
    return true;
  }
}

/**
 * Get parent origin (for cross-origin iframe communication)
 */
export function getParentOrigin(): string {
  if (typeof window === 'undefined') return '*';

  // Try to get referrer as origin hint
  if (document.referrer) {
    try {
      const url = new URL(document.referrer);
      return url.origin;
    } catch {
      // Fallback to wildcard
    }
  }

  // Default to wildcard (parent should filter messages by source)
  return '*';
}

/**
 * Send message to parent iframe
 */
export function postMessageToParent(message: Omit<IframeMessage, 'source'>): void {
  if (!isInIframe()) {
    console.warn('[Iframe Bridge] Not in iframe, message not sent:', message);
    return;
  }

  try {
    const fullMessage: IframeMessage = {
      ...message,
      source: 'mappedin-conference-map'
    };

    const targetOrigin = getParentOrigin();
    window.parent.postMessage(fullMessage, targetOrigin);
    console.log('[Iframe Bridge] Sent to parent:', fullMessage);
  } catch (error) {
    console.error('[Iframe Bridge] Failed to send message:', error);
  }
}

/**
 * Notify parent of content height changes (for responsive iframe)
 */
export function notifyHeightChange(): void {
  const height = document.documentElement.offsetHeight;
  const scrollHeight = document.documentElement.scrollHeight;

  postMessageToParent({
    type: 'iframe:height',
    payload: { height, scrollHeight }
  });
}

/**
 * Notify parent when exhibitor is clicked
 */
export function notifyExhibitorClicked(exhibitor: {
  externalId: string;
  name: string;
  boothNumber?: string;
}): void {
  postMessageToParent({
    type: 'exhibitor:clicked',
    payload: exhibitor
  });
}

/**
 * Notify parent that map is loaded
 */
export function notifyIframeReady(): void {
  postMessageToParent({
    type: 'iframe:ready',
    payload: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  });
}

/**
 * Listen for messages from parent iframe
 */
export function onMessageFromParent(callback: (message: any) => void): () => void {
  const handler = (event: MessageEvent) => {
    // Security: Validate message source if needed
    // For now, accept all messages (parent should include identifier)

    try {
      console.log('[Iframe Bridge] Received from parent:', event.data);
      callback(event.data);
    } catch (error) {
      console.error('[Iframe Bridge] Failed to process message:', error);
    }
  };

  window.addEventListener('message', handler);

  return () => {
    window.removeEventListener('message', handler);
  };
}

/**
 * Setup responsive iframe height tracking
 */
export function setupResponsiveIframe(): () => void {
  if (!isInIframe()) {
    console.log('[Iframe Bridge] Not in iframe, skipping responsive setup');
    return () => {};
  }

  console.log('[Iframe Bridge] Setting up responsive iframe...');

  // Initial height notification
  notifyIframeReady();
  notifyHeightChange();

  // Track height changes using ResizeObserver
  const resizeObserver = new ResizeObserver(() => {
    notifyHeightChange();
  });

  resizeObserver.observe(document.documentElement);

  // Also listen for window resize (viewport changes)
  const handleResize = () => {
    notifyHeightChange();
  };

  window.addEventListener('resize', handleResize);

  // Cleanup function
  return () => {
    resizeObserver.disconnect();
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * Initialize iframe bridge
 */
export function initIframeBridge(options: {
  onNavigateToExhibitor?: (externalId: string) => void;
  onParentMessage?: (message: any) => void;
}): () => void {
  console.log('[Iframe Bridge] Initializing...', {
    isIframe: isInIframe(),
    parentOrigin: getParentOrigin()
  });

  const cleanups: Array<() => void> = [];

  // Setup responsive height tracking
  cleanups.push(setupResponsiveIframe());

  // Listen for parent messages
  cleanups.push(
    onMessageFromParent((message) => {
      // Handle navigation requests
      if (message.type === 'navigate:exhibitor' && message.payload?.externalId) {
        options.onNavigateToExhibitor?.(message.payload.externalId);
      }

      // Forward all messages to custom handler
      options.onParentMessage?.(message);
    })
  );

  // Combined cleanup
  return () => {
    cleanups.forEach(cleanup => cleanup());
  };
}

/**
 * Utility: Create iframe embed code for documentation
 */
export function generateIframeEmbedCode(options: {
  url: string;
  width?: string;
  height?: string;
  responsive?: boolean;
}): string {
  const { url, width = '100%', height = '600px', responsive = true } = options;

  if (responsive) {
    return `<!-- Responsive Iframe Wrapper -->
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
  <iframe
    src="${url}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    allowfullscreen
    loading="lazy"
  ></iframe>
</div>`;
  }

  return `<iframe
  src="${url}"
  width="${width}"
  height="${height}"
  style="border: none; max-width: 100%;"
  allowfullscreen
  loading="lazy"
></iframe>`;
}
