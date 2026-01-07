import React, { useEffect, useRef } from 'react';
import './UnityGame.css';
import { logger } from './utils/logger';

function UnityGame() {
  const canvasRef = useRef(null);
  const unityInstanceRef = useRef(null);
  const containerRef = useRef(null);
  const scriptRef = useRef(null);
  const memoryMonitorRef = useRef(null);

  useEffect(() => {
    let rafId;
    
    // Use requestAnimationFrame to ensure DOM is fully rendered
    rafId = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;

      if (!canvas || !container) {
        logger.warn('Canvas or container not found');
        return;
      }
      
      // Ensure canvas is in the DOM
      if (!canvas.isConnected) {
        logger.warn('Canvas not connected to DOM, waiting...');
        // Retry after DOM is ready
        setTimeout(() => {
          if (canvas.isConnected) {
            initializeUnity(canvas, container);
          }
        }, 100);
        return;
      }
      
      initializeUnity(canvas, container);
    });
    
    function initializeUnity(canvas, container) {
      if (!canvas || !container || !canvas.isConnected) {
        return;
      }

      // Unity show banner function
      function unityShowBanner(msg, type) {
      const warningBanner = document.querySelector("#unity-warning");
      if (!warningBanner) return;

      function updateBannerVisibility() {
        warningBanner.style.display = warningBanner.children.length ? 'block' : 'none';
      }
      const div = document.createElement('div');
      div.innerHTML = msg;
      warningBanner.appendChild(div);
      if (type === 'error') {
        div.style = 'background: red; padding: 10px;';
      } else {
        if (type === 'warning') {
          div.style = 'background: yellow; padding: 10px;';
        }
        setTimeout(function() {
          if (warningBanner.contains(div)) {
            warningBanner.removeChild(div);
            updateBannerVisibility();
          }
        }, 5000);
      }
      updateBannerVisibility();
    }

    const buildUrl = "/Build";
    const loaderUrl = buildUrl + "/thirdB.loader.js";
    const config = {
      arguments: [],
      dataUrl: buildUrl + "/thirdB.data",
      frameworkUrl: buildUrl + "/thirdB.framework.js",
      codeUrl: buildUrl + "/thirdB.wasm",
      streamingAssetsUrl: "/StreamingAssets",
      companyName: "DefaultCompany",
      productName: "ZoomQuest",
      productVersion: "5.0.5",
      showBanner: unityShowBanner,
    };

    // Ensure canvas is properly configured before Unity initialization
    // Set canvas attributes for WebGL
    canvas.setAttribute('tabindex', '-1');
    canvas.style.outline = 'none';
    
    // Handle mobile vs desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      container.className = "unity-mobile";
      canvas.className = "unity-mobile";
    } else {
      container.className = "unity-desktop";
      // Make canvas fullscreen via CSS - Unity will set actual dimensions
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
    }
    
    // Verify WebGL support before proceeding (test on a separate canvas, not the Unity canvas)
    const testCanvas = document.createElement('canvas');
    const testGl = testCanvas.getContext('webgl') || testCanvas.getContext('webgl2') || testCanvas.getContext('experimental-webgl');
    if (!testGl) {
      logger.error('WebGL is not supported in this browser');
      alert('WebGL is not supported in your browser. Please use a modern browser with WebGL support.');
      return;
    }
    
    // Set canvas dimensions - Unity needs actual pixel dimensions, not just CSS
    // Calculate based on container or viewport
    const containerRect = container.getBoundingClientRect();
    const canvasWidth = containerRect.width > 0 ? containerRect.width : window.innerWidth;
    const canvasHeight = containerRect.height > 0 ? containerRect.height : window.innerHeight;
    
    // Ensure minimum dimensions for WebGL context creation
    const minWidth = Math.max(canvasWidth, 320);
    const minHeight = Math.max(canvasHeight, 240);
    
    // Set actual canvas dimensions (required for WebGL context)
    canvas.width = minWidth;
    canvas.height = minHeight;
    
    logger.log('Canvas dimensions set:', { width: canvas.width, height: canvas.height });

    // Show loading bar
    const loadingBar = document.querySelector("#unity-loading-bar");
    if (loadingBar) {
      loadingBar.style.display = "block";
    }

    // Wait a frame to ensure canvas is fully rendered and ready for WebGL
    requestAnimationFrame(() => {
      // Load Unity after canvas is confirmed ready
      loadUnityScript();
    });
    
    function loadUnityScript() {
      // Load Unity
      const script = document.createElement("script");
      script.src = loaderUrl;
    script.onload = () => {
      // eslint-disable-next-line no-undef
      if (typeof createUnityInstance !== 'undefined') {
        // eslint-disable-next-line no-undef
        createUnityInstance(canvas, config, (progress) => {
          const progressBar = document.querySelector("#unity-progress-bar-full");
          if (progressBar) {
            progressBar.style.width = 100 * progress + "%";
          }
        }).then((unityInstance) => {
          unityInstanceRef.current = unityInstance;
          if (loadingBar) {
            loadingBar.style.display = "none";
          }
          const fullscreenButton = document.querySelector("#unity-fullscreen-button");
          if (fullscreenButton) {
            fullscreenButton.onclick = () => {
              unityInstance.SetFullscreen(1);
            };
          }
          logger.log('Unity instance initialized successfully');
        }).catch((message) => {
          logger.error('Unity initialization error:', message);
          
          // Hide loading bar on error
          if (loadingBar) {
            loadingBar.style.display = "none";
          }
          
          // Check for specific WebGL errors
          const errorStr = typeof message === 'string' ? message : String(message);
          let userMessage = 'Failed to load Unity game.';
          
          if (errorStr.includes('GLctx') || errorStr.includes('WebGL')) {
            userMessage = 'WebGL context error. Please try:\n' +
                         '1. Refresh the page\n' +
                         '2. Update your browser\n' +
                         '3. Check if WebGL is enabled in browser settings';
          } else if (errorStr.includes('memory') || errorStr.includes('Memory')) {
            userMessage = 'Memory error. The game requires more memory than available.';
          } else {
            userMessage = 'Failed to load Unity game: ' + errorStr;
          }
          
          alert(userMessage + '\n\nPlease try refreshing the page or contact support if the issue persists.');
          
          // Clear Unity instance reference on error
          unityInstanceRef.current = null;
        });
      }
    };
    script.onerror = () => {
      logger.error('Failed to load Unity loader script');
      alert('Failed to load Unity game. Please check that the Build files are in the public folder.');
    };

      document.body.appendChild(script);
      scriptRef.current = script;
    }
    }
    
    // Memory monitoring with 256MB Zoom limit enforcement
    const ZOOM_MEMORY_LIMIT_MB = 256;
    const WARNING_THRESHOLD_MB = 200; // Warn at 200MB
    const CRITICAL_THRESHOLD_MB = 240; // Critical at 240MB
    
    const memoryMonitor = setInterval(() => {
      if (unityInstanceRef.current && unityInstanceRef.current.GetMetricsInfo) {
        try {
          const metrics = unityInstanceRef.current.GetMetricsInfo();
          
          // Calculate total memory usage in MB
          const wasmHeapMB = metrics.totalWASMHeapSize / 1024 / 1024;
          const jsHeapMB = metrics.totalJSHeapSize / 1024 / 1024;
          const totalMemoryMB = wasmHeapMB + jsHeapMB;
          
          // Calculate usage percentages
          const wasmUsagePercent = (metrics.usedWASMHeapSize / metrics.totalWASMHeapSize) * 100;
          const jsUsagePercent = (metrics.usedJSHeapSize / metrics.totalJSHeapSize) * 100;
          
          // Memory monitoring with Zoom 256MB limit
          if (totalMemoryMB > CRITICAL_THRESHOLD_MB) {
            logger.error('CRITICAL: Memory approaching Zoom limit!', {
              total: totalMemoryMB.toFixed(2) + 'MB',
              limit: ZOOM_MEMORY_LIMIT_MB + 'MB',
              remaining: (ZOOM_MEMORY_LIMIT_MB - totalMemoryMB).toFixed(2) + 'MB',
              wasm: wasmHeapMB.toFixed(2) + 'MB',
              js: jsHeapMB.toFixed(2) + 'MB',
              wasmUsage: wasmUsagePercent.toFixed(1) + '%',
              jsUsage: jsUsagePercent.toFixed(1) + '%',
              fps: metrics.fps?.toFixed(2)
            });
            
            // Attempt to trigger Unity garbage collection if possible
            try {
              if (unityInstanceRef.current.SendMessage) {
                unityInstanceRef.current.SendMessage('System', 'GC.Collect', '');
                logger.log('Triggered Unity garbage collection');
              }
            } catch (e) {
              // GC trigger not available or failed
            }
          } else if (totalMemoryMB > WARNING_THRESHOLD_MB) {
            logger.warn('Memory usage high - approaching Zoom limit:', {
              total: totalMemoryMB.toFixed(2) + 'MB',
              limit: ZOOM_MEMORY_LIMIT_MB + 'MB',
              remaining: (ZOOM_MEMORY_LIMIT_MB - totalMemoryMB).toFixed(2) + 'MB',
              wasm: wasmHeapMB.toFixed(2) + 'MB',
              js: jsHeapMB.toFixed(2) + 'MB',
              wasmUsage: wasmUsagePercent.toFixed(1) + '%',
              jsUsage: jsUsagePercent.toFixed(1) + '%',
              fps: metrics.fps?.toFixed(2)
            });
          }
          
          // Log detailed memory metrics in development
          if (process.env.NODE_ENV === 'development') {
            logger.log('Unity Memory Metrics:', {
              total: totalMemoryMB.toFixed(2) + 'MB / ' + ZOOM_MEMORY_LIMIT_MB + 'MB',
              wasmHeap: `${(metrics.usedWASMHeapSize / 1024 / 1024).toFixed(2)}MB / ${wasmHeapMB.toFixed(2)}MB (${wasmUsagePercent.toFixed(1)}%)`,
              jsHeap: `${(metrics.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / ${jsHeapMB.toFixed(2)}MB (${jsUsagePercent.toFixed(1)}%)`,
              fps: metrics.fps?.toFixed(2),
              status: totalMemoryMB > CRITICAL_THRESHOLD_MB ? 'CRITICAL' : 
                      totalMemoryMB > WARNING_THRESHOLD_MB ? 'WARNING' : 'OK'
            });
          }
        } catch (e) {
          // Ignore errors in memory monitoring
          logger.error('Error in memory monitoring:', e);
        }
      }
    }, 5000); // Check every 5 seconds for better monitoring
    memoryMonitorRef.current = memoryMonitor;

    // Cleanup function with proper memory management
    return () => {
      // Cancel the animation frame if component unmounts before initialization
      cancelAnimationFrame(rafId);
      
      let isCleanedUp = false;
      
      const cleanup = async () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        
        logger.log('Starting Unity cleanup...');
        
        // 1. Clear memory monitor first
        if (memoryMonitorRef.current) {
          clearInterval(memoryMonitorRef.current);
          memoryMonitorRef.current = null;
        }
        
        // 2. Quit Unity instance properly FIRST (Unity will handle WebGL context cleanup)
        if (unityInstanceRef.current) {
          try {
            // Wait for Unity to quit - it will clean up its own WebGL context
            await unityInstanceRef.current.Quit();
            logger.log('Unity instance quit successfully');
            
            // Wait a bit for Unity's cleanup to complete
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (e) {
            logger.error('Error quitting Unity instance:', e);
          } finally {
            unityInstanceRef.current = null;
          }
        }
        
        // 3. Remove script tag
        if (scriptRef.current && scriptRef.current.parentNode) {
          try {
            scriptRef.current.parentNode.removeChild(scriptRef.current);
            scriptRef.current = null;
          } catch (e) {
            // Script might already be removed
          }
        }
        
        // 4. Clear Unity DOM elements (but keep container structure)
        const unityContainer = document.getElementById('unity-container');
        if (unityContainer) {
          try {
            const loadingBar = unityContainer.querySelector('#unity-loading-bar');
            const warning = unityContainer.querySelector('#unity-warning');
            const footer = unityContainer.querySelector('#unity-footer');
            
            if (loadingBar) loadingBar.remove();
            if (warning) warning.innerHTML = '';
            if (footer) footer.remove();
          } catch (e) {
            // Ignore errors
          }
        }
        
        logger.log('Unity cleanup completed');
      };
      
      cleanup();
    };
  }, []);

  // Set background images for Unity UI elements
  useEffect(() => {
    const logo = document.getElementById('unity-logo');
    const progressBarEmpty = document.getElementById('unity-progress-bar-empty');
    const progressBarFull = document.getElementById('unity-progress-bar-full');
    const logoTitleFooter = document.getElementById('unity-logo-title-footer');
    const fullscreenButton = document.getElementById('unity-fullscreen-button');

    if (logo) logo.style.backgroundImage = "url('/TemplateData/unity-logo-dark.png')";
    if (progressBarEmpty) progressBarEmpty.style.backgroundImage = "url('/TemplateData/progress-bar-empty-dark.png')";
    if (progressBarFull) progressBarFull.style.backgroundImage = "url('/TemplateData/progress-bar-full-dark.png')";
    if (logoTitleFooter) logoTitleFooter.style.backgroundImage = "url('/TemplateData/unity-logo-title-footer.png')";
    if (fullscreenButton) fullscreenButton.style.backgroundImage = "url('/TemplateData/fullscreen-button.png')";
  }, []);

  return (
    <div className="unity-game-container">
      <div id="unity-container" ref={containerRef} className="unity-desktop">
        <canvas id="unity-canvas" ref={canvasRef} tabIndex="-1"></canvas>
        <div id="unity-loading-bar">
          <div id="unity-logo"></div>
          <div id="unity-progress-bar-empty">
            <div id="unity-progress-bar-full"></div>
          </div>
        </div>
        <div id="unity-warning"></div>
        <div id="unity-footer">
          <div id="unity-logo-title-footer"></div>
          <div id="unity-fullscreen-button"></div>
          <div id="unity-build-title">ZoomQuest</div>
        </div>
      </div>
    </div>
  );
}

export default UnityGame;

