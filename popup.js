document.addEventListener('DOMContentLoaded', () => {
  const darkModeBtn = document.getElementById('darkModeBtn');
  const lightModeBtn = document.getElementById('lightModeBtn');
  const customTintPicker = document.getElementById('customTintPicker');

  // Load existing configuration from storage
  chrome.storage.local.get(['theme', 'customTint'], (result) => {
    if (result.customTint) {
      customTintPicker.value = result.customTint;
    }
  });

  const updateTheme = (themeData) => {
    chrome.storage.local.set(themeData, () => {
      // Dispatch immediately to the active tab if available
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab && tab.id) {
          // Skip privileged URLs where injection is blocked natively
          if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
            alert("Extensions cannot modify browser settings pages or new tab pages. Try opening a normal website!");
            return;
          }
          
          chrome.tabs.sendMessage(tab.id, { action: 'applyTheme', ...themeData }).catch((err) => {
            console.log("Communication failed, injecting script dynamically...", err);
            // Script was likely not loaded (e.g. if tab was opened before extension was loaded)
            chrome.scripting.executeScript({
              target: { tabId: tab.id, allFrames: true },
              files: ['content.js']
            }).then(() => {
              // Try sending the message again after successful injection
              chrome.tabs.sendMessage(tab.id, { action: 'applyTheme', ...themeData }).catch(e => console.error("Still failing after injection", e));
            }).catch(e => {
              console.error("Script injection failed:", e);
            });
          });
        }
      });
    });
  };

  darkModeBtn.addEventListener('click', () => {
    updateTheme({ theme: 'dark' });
  });

  lightModeBtn.addEventListener('click', () => {
    updateTheme({ theme: 'light' });
  });

  customTintPicker.addEventListener('input', (e) => {
    updateTheme({ theme: 'custom', customTint: e.target.value });
  });
});
