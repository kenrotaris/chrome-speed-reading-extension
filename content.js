// content.js

// Store settings
let settings = {
  enabled: false,
  shortWords: 33,
  mediumWords: 33,
  longWords: 33,
};

// Initialize extension
chrome.storage.sync.get(settings, (stored) => {
  settings = stored;
  if (settings.enabled) {
    applyBoldToPage();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "toggleBold":
      settings.enabled = message.enabled;
      settings.enabled ? applyBoldToPage() : removeBoldFromPage();
      sendResponse({ success: true });
      break;
    case "updateSettings":
      Object.assign(settings, message.settings);
      if (settings.enabled) {
        applyBoldToPage();
      }
      sendResponse({ success: true });
      break;
  }
  return true; // Maintain async response capability
});

// Get bold percentage based on word length
function getBoldPercentage(word) {
  const length = word.length;
  if (length <= 3) return settings.shortWords;
  if (length <= 7) return settings.mediumWords;
  return settings.longWords;
}

// Check if word contains only letters
function isWordProcessable(word) {
  // Only process words that contain alphabets
  return /^[a-zA-Z]+$/.test(word);
}

// Apply bold formatting to text
function applyBoldToWord(word) {
  if (!word.trim() || !isWordProcessable(word)) return word;
  const boldLength = Math.ceil(word.length * (getBoldPercentage(word) / 100));
  return `<strong>${word.slice(0, boldLength)}</strong>${word.slice(
    boldLength
  )}`;
}

// Process text nodes
function processTextNode(node) {
  const text = node.textContent;
  const words = text.split(/(\s+)/);
  const processed = words
    .map((word) => (isWordProcessable(word) ? applyBoldToWord(word) : word))
    .join("");

  const span = document.createElement("span");
  span.innerHTML = processed;
  span.className = "boldspeed-text";
  node.replaceWith(span);
}

// Check if element should be skipped
function shouldSkipElement(element) {
  // Skip interactive elements
  if (
    element.matches(
      "button, input, textarea, select, nav, header, h1, h2, h3, h4, h5, h6"
    )
  )
    return true;

  // Skip elements with specific roles
  if (
    element.getAttribute("role") === "button" ||
    element.getAttribute("role") === "navigation"
  )
    return true;

  // Skip code and pre elements
  if (element.matches("code, pre, a")) return true;

  // Skip elements that are likely to be UI components
  if (element.matches(".nav, .navigation, .menu, .header, .footer"))
    return true;

  // Skip elements with specific font styles that indicate UI elements
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.fontWeight >= 600 || computedStyle.fontSize > "16px")
    return true; // Skip already bold text and larger text

  return false;
}

// Apply bold to page
function applyBoldToPage() {
  if (!settings.enabled) return; // Ensure it only runs if enabled

  // Remove any previous formatting first to reset the state
  removeBoldFromPage();

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent || shouldSkipElement(parent)) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.textContent.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    }
  );

  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  nodes.forEach(processTextNode);
}

// Remove bold formatting
function removeBoldFromPage() {
  const formattedElements = document.querySelectorAll(".boldspeed-text");
  formattedElements.forEach((el) => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent), el);
    }
  });
}
