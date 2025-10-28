<script lang="ts">
  import { onMount } from 'svelte';
  import MapView from '$lib/components/MapView.svelte';
  import MapLabels from '$lib/components/MapLabels.svelte';
  import Search from '$lib/components/Search.svelte';
  import LocationCard from '$lib/components/LocationCard.svelte';
  import StatusBar from '$lib/components/StatusBar.svelte';
  import FloorSelector from '$lib/components/FloorSelector.svelte';
  import AccessibilityToggle from '$lib/components/AccessibilityToggle.svelte';
  import BlueDotControl from '$lib/components/BlueDotControl.svelte';
  import Toast from '$lib/components/ui/toast.svelte';

  // Bridge utilities for embedding
  import { initWebViewBridge, isReactNativeWebView } from '$lib/utils/webview-bridge';
  import { initIframeBridge, isInIframe } from '$lib/utils/iframe-bridge';
  import { navigateToExhibitor, handleInitialDeepLink } from '$lib/utils/navigation';

  onMount(() => {
    console.log('[App] Initializing embedding bridges...');
    console.log('[App] Environment:', {
      isWebView: isReactNativeWebView(),
      isIframe: isInIframe(),
      userAgent: navigator.userAgent
    });

    const cleanups: Array<() => void> = [];

    // Initialize React Native WebView bridge
    if (isReactNativeWebView()) {
      console.log('[App] Initializing React Native WebView bridge');
      cleanups.push(
        initWebViewBridge({
          onNavigateToExhibitor: (externalId) => {
            console.log('[App] WebView navigation request:', externalId);
            navigateToExhibitor(externalId);
          }
        })
      );
    }

    // Initialize iframe bridge
    if (isInIframe()) {
      console.log('[App] Initializing iframe bridge');
      cleanups.push(
        initIframeBridge({
          onNavigateToExhibitor: (externalId) => {
            console.log('[App] Iframe navigation request:', externalId);
            navigateToExhibitor(externalId);
          }
        })
      );
    }

    // Handle deep links from URL hash
    handleInitialDeepLink();

    // Cleanup on unmount
    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  });
</script>

<main class="relative w-full h-screen overflow-hidden">
  <!-- 3D Map Container -->
  <MapView />
  <MapLabels />

  <!-- UI Overlay Components -->
  <Search />
  <StatusBar />
  <LocationCard />
  <FloorSelector />
  <AccessibilityToggle />
  <BlueDotControl />

  <!-- Toast Notifications -->
  <Toast />

  <!-- Branding (moved to avoid BlueDot button) -->
  <div class="absolute bottom-20 left-4 text-sm text-muted-foreground/60 z-10 select-none sm:bottom-24 md:bottom-28">
    Powered by <span class="font-semibold">Mappedin</span>
  </div>
</main>
