// popup/popup.js

// Get DOM elements
const toggleButton = document.getElementById("toggleButton");
const settingsButton = document.getElementById("settingsButton");
const settingsContainer = document.getElementById("settingsContainer");
const status = document.getElementById("status");
const shortWordsSlider = document.getElementById("shortWords");
const mediumWordsSlider = document.getElementById("mediumWords");
const longWordsSlider = document.getElementById("longWords");
const shortValueDisplay = document.getElementById("shortValue");
const mediumValueDisplay = document.getElementById("mediumValue");
const longValueDisplay = document.getElementById("longValue");
const restoreDefaults = document.getElementById("restoreDefaults");

// Default settings
const defaultSettings = {
  enabled: false,
  shortWords: 33,
  mediumWords: 33,
  longWords: 33,
};

// Initialize settings on popup open
async function initializeSettings() {
  const storedSettings = await chrome.storage.sync.get(defaultSettings);
  toggleButton.checked = storedSettings.enabled;
  updateStatus(storedSettings.enabled);
  updateSliders(storedSettings);
}

// Update the status text
function updateStatus(enabled) {
  status.textContent = `BoldSpeed is currently ${
    enabled ? "active" : "inactive"
  }`;
}

// Update slider positions and display values
function updateSliders(settings) {
  shortWordsSlider.value = settings.shortWords;
  shortValueDisplay.textContent = `${settings.shortWords}%`;
  mediumWordsSlider.value = settings.mediumWords;
  mediumValueDisplay.textContent = `${settings.mediumWords}%`;
  longWordsSlider.value = settings.longWords;
  longValueDisplay.textContent = `${settings.longWords}%`;
}

// Toggle extension enabled/disabled
toggleButton.addEventListener("change", async () => {
  const enabled = toggleButton.checked;
  updateStatus(enabled);
  await chrome.storage.sync.set({ enabled });
  sendMessageToContentScript({ type: "toggleBold", enabled });
});

// Update settings from sliders
function addSliderListeners() {
  [shortWordsSlider, mediumWordsSlider, longWordsSlider].forEach((slider) => {
    slider.addEventListener("input", () => {
      const setting = {
        [slider.id.replace("Words", "") + "Words"]: parseInt(slider.value),
      };
      document.getElementById(
        slider.id.replace("Words", "") + "Value"
      ).textContent = `${slider.value}%`;
      chrome.storage.sync.set(setting);
      sendMessageToContentScript({
        type: "updateSettings",
        settings: setting,
      });
    });
  });
}

// Restore default settings
restoreDefaults.addEventListener("click", async () => {
  await chrome.storage.sync.set(defaultSettings);
  updateSliders(defaultSettings);
  sendMessageToContentScript({
    type: "updateSettings",
    settings: defaultSettings,
  });
});

// Toggle settings container visibility
settingsButton.addEventListener("click", () => {
  settingsContainer.classList.toggle("hidden");
});

// Send message to content script
function sendMessageToContentScript(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
        if (chrome.runtime.lastError || !response.success) {
          console.warn("Tab may need to be refreshed to apply changes");
        }
      });
    }
  });
}

// Initialize popup when opened
initializeSettings();
addSliderListeners();
