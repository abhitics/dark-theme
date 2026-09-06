// Ensure we do not redeclare things if injected multiple times by chrome.scripting.executeScript
if (typeof window.utcThemeScriptLoaded === 'undefined') {
  window.utcThemeScriptLoaded = true;

  const applyTheme = (theme, customTint) => {
    const injectStyles = () => {
      let styleEl = document.getElementById('utc-theme-styles');
      
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'utc-theme-styles';
        // Try getting head, documentElement, or just document.body
        const root = document.head || document.documentElement || document.body;
        if (root) {
          root.appendChild(styleEl);
        } else {
          return false; // Wait until DOM is slightly more ready
        }
      }

      const isPDF = document.contentType === 'application/pdf' || window.location.href.toLowerCase().endsWith('.pdf');

      if (theme === 'light') {
        styleEl.textContent = '';
        return true;
      }

      let css = '';

      if (theme === 'dark') {
        if (isPDF) {
          css = `
            html, body, embed, object, iframe, viewer-pdf-toolbar, viewer-pdf-sidenav {
              filter: invert(1) hue-rotate(180deg) !important;
              background-color: #333333 !important;
            }
          `;
        } else {
          css = `
            html {
              filter: invert(1) hue-rotate(180deg) !important;
              background-color: #121212 !important;
            }
            /* Re-invert media assets to maintain native colors */
            img, video, iframe, canvas, object, embed, picture, svg, [style*="background-image"] {
              filter: invert(1) hue-rotate(180deg) !important;
            }
          `;
        }
      } else if (theme === 'custom' && customTint) {
        css = `
          html::after {
            content: "";
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background-color: ${customTint} !important;
            opacity: 0.3 !important;
            pointer-events: none !important;
            z-index: 2147483647 !important;
            mix-blend-mode: multiply !important;
          }
        `;
      }

      styleEl.textContent = css;
      return true;
    };

    // Safe injection at document_start
    if (!injectStyles()) {
      const observer = new MutationObserver(() => {
        if (injectStyles()) {
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement || document, { childList: true, subtree: true });
    }
  };

  // Check for existing preference on page load immediately
  chrome.storage.local.get(['theme', 'customTint'], (result) => {
    if (result.theme) {
      applyTheme(result.theme, result.customTint);
    }
  });

  // React to live changes from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'applyTheme') {
      applyTheme(request.theme, request.customTint);
      sendResponse({ success: true });
    }
  });
}
