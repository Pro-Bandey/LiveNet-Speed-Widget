# LiveNet Speed Widget

A cross-browser extension built using Manifest V3 that injects a lightweight, customizable, floating internet telemetry widget on every web page. The widget isolates itself from host website styles and remembers its position on a per-site basis.

---

## Available on

<!-- <div align="center">

[![Firefox Add-ons](https://raw.githubusercontent.com/MegaMind-Solution/MegaMind-Solution/refs/heads/main/images/badges/firefoxaddons.png)](https://addons.mozilla.org/firefox/addon/YOUR_EXTENSION_ID/)

</div> -->

## Key Features

- **Isolated UI Sandbox:** Renders entirely inside a **Shadow DOM** so that host website CSS styles do not interfere with or break the layout.
- **Accurate Telemetry:** Uses a mix of browser connectivity estimations and real background HTTP ping requests (via Cloudflare edge nodes) to display accurate round-trip time (RTT).
- **Page Footprint Analyzer:** Evaluates the active page's performance by measuring real-time file download size (Page Weight) and load time duration.
- **Advanced Drag & Snap:** Can be dragged anywhere on the screen with pointer-based physics, snapping to the viewport edges when placed within 15px of a boundary.
- **DblClick Collapse:** Double-clicking the widget toggles a compact layout, hiding all metrics except for the status dot and download speeds.
- **Click-Through Mode:** Holding the **Alt** key temporarily sets the widget to be transparent and click-through (`pointer-events: none`), letting you click elements underneath without moving it.
- **Alt + S Visibility Toggle:** Pressing the **Alt + S** keyboard shortcut hides or shows the widget instantly on the current webpage.
- **Personalized Themes:** Customize the widget's accent color dynamically via a real-time color picker in the popup menu.
- **Multi-Device Settings Sync:** Layout coordinates and collapse preferences are saved locally on your device (`chrome.storage.local`), while global configurations, themes, and domain blacklists are synchronized across your browsers (`chrome.storage.sync`) [1].

---

## Guide to Settings & Interactions

### Interacting with the Widget:

- **Repositioning:** Click and hold anywhere on the bar to drag it. Letting go of the mouse close to any screen edge will snap it cleanly in place.
- **Collapsing/Expanding:** Double-click on the widget to minimize it into a smaller badge. Double-click it again to return to full-size view.
- **Hovering:** The widget sits at 60% opacity by default. Hovering over it transitions it to full opacity for clearer visibility.
- **Pass-through Clicking:** Hold the **Alt** key on your keyboard while clicking over the widget to click page links directly behind it.

### Controlling Settings (Extension Pop-up):

Clicking the extension icon in your toolbar launches a quick-settings panel:

- **Enable Globally Toggle:** Turn this toggle off to temporarily hide the widget on all websites.
- **Accent Highlight Color:** Use the interactive color picker to replace the green highlight on your layout with a custom hue.
- **Block/Unblock Site:** If the widget is obtrusive on a specific dashboard or application, click **Block On This Site** to blacklist that domain.
- **Reset Layout Positions:** Click this button to wipe all coordinates and collapse-state caches, restoring the widget to its default top-right layout globally.
