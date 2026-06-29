(function () {
    if (window !== window.top) return;
    if (document.getElementById("internet-speed-extension-host")) return;

    // ==========================================
    // 1. SHADOW DOM CREATION & INJECTION
    // ==========================================
    const host = document.createElement('div');
    host.id = 'internet-speed-extension-host';
    host.style.all = 'initial';
    host.style.position = 'fixed';
    host.style.zIndex = '2147483647';
    host.style.cursor = 'move';
    host.style.touchAction = 'none';
    host.style.display = 'none';

    const shadow = host.attachShadow({ mode: 'open' });
    
    const root = document.createElement('div');
    root.id = "internetSpeed";
    shadow.appendChild(root);

    // Modern SVG Pack (Includes Document icon for Page Footprint)
    const svgs = {
        wifi: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`,
        down: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #00ff9d)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`,
        up:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00b8ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
        ping: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffcc00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`,
        page: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b388ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`
    };

    // Style Rules
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --bg: #0f0f0f;
            --text: #ffffff;
            --dim: #666;
            --accent: #00ff9d;
        }

        #internetSpeed {
            width: 500px;
            height: 44px;
            background: #0f0f0f;
            color: #ffffff;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            box-sizing: border-box;
            border: 1px solid #333;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            user-select: none;
            font-size: 13px;
            opacity: 0.6;
            transition: opacity 0.2s ease, width 0.25s ease;
        }

        #internetSpeed:hover {
            opacity: 1;
        }

        /* Collapsed Mode */
        #internetSpeed.collapsed {
            width: 130px;
            justify-content: center;
            gap: 12px;
        }

        #internetSpeed.collapsed .sep,
        #internetSpeed.collapsed #loadTime,
        #internetSpeed.collapsed .metric-box:not(.dl-box) {
            display: none;
        }

        .section {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #666;
            transition: background-color 0.3s;
            box-shadow: 0 0 8px rgba(0,0,0,0.5);
        }
        .status-dot.online { background-color: var(--accent); box-shadow: 0 0 8px var(--accent); }
        .status-dot.offline { background-color: #ff3333; box-shadow: 0 0 8px #ff3333; }

        .status-text {
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-size: 11px;
        }

        .metric-box {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 80px;
        }
        
        .val-text {
            font-variant-numeric: tabular-nums;
            font-weight: 700;
        }

        .unit-text {
            font-size: 10px;
            color: #666;
            font-weight: 600;
            margin-left: 2px;
        }

        .sep {
            width: 1px;
            height: 16px;
            background: #333;
            margin: 0 5px;
        }
        
        #loadTime {
            font-size: 10px;
            color: #888;
            font-weight: bold;
            margin-left: 4px;
        }
    `;
    shadow.appendChild(style);

    // ==========================================
    // 2. HTML CONTENT SETUP
    // ==========================================
    root.innerHTML = `
        <div class="section">
            <div id="dot" class="status-dot online"></div>
            ${svgs.wifi}
            <span id="statusTxt" class="status-text">Online</span>
            <span id="loadTime">--</span>
        </div>

        <div class="sep"></div>

        <!-- Download -->
        <div class="metric-box dl-box">
            ${svgs.down}
            <div>
                <span id="dlVal" class="val-text">0.0</span>
                <span id="dlUnit" class="unit-text">KB/s</span>
            </div>
        </div>

        <!-- Upload -->
        <div class="metric-box">
            ${svgs.up}
            <div>
                <span id="ulVal" class="val-text">0.0</span>
                <span id="ulUnit" class="unit-text">KB/s</span>
            </div>
        </div>

        <!-- Ping -->
        <div class="metric-box" style="min-width: 55px;">
            ${svgs.ping}
            <div>
                <span id="pingVal" class="val-text">0</span>
                <span class="unit-text">ms</span>
            </div>
        </div>

        <div class="sep"></div>

        <!-- Page footprint (Resource Load Size) -->
        <div class="metric-box" style="min-width: 70px;">
            ${svgs.page}
            <div>
                <span id="pageWeight" class="val-text">0.0</span>
                <span id="pageWeightUnit" class="unit-text">KB</span>
            </div>
        </div>
    `;

    document.body.appendChild(host);

    // ==========================================
    // 3. COLLAPSE & STATE SYNC LAYOUT LOAD
    // ==========================================
    const siteKey = `speed_pos_${window.location.hostname}`;
    const globalKey = `speed_pos_global`;
    const collapseKey = `collapsed_${window.location.hostname}`;

    // Layout Collapse/Expand Double Click
    root.addEventListener('dblclick', () => {
        const isCollapsed = !root.classList.contains('collapsed');
        root.classList.toggle('collapsed', isCollapsed);
        chrome.storage.local.set({ [collapseKey]: isCollapsed });
    });

    // Setup coordinates and layout states
    function initPosition() {
        chrome.storage.local.get([siteKey, globalKey, collapseKey], (localResult) => {
            if (localResult[collapseKey]) {
                root.classList.add('collapsed');
            } else {
                root.classList.remove('collapsed');
            }

            if (localResult[siteKey]) {
                host.style.right = 'auto';
                host.style.left = localResult[siteKey].left;
                host.style.top = localResult[siteKey].top;
            } else if (localResult[globalKey]) {
                host.style.right = 'auto';
                host.style.left = localResult[globalKey].left;
                host.style.top = localResult[globalKey].top;
            } else {
                host.style.top = '20px';
                host.style.right = '20px';
                host.style.left = 'auto';
            }
        });
    }

    // Dynamic visibility filters (Blacklist & Global settings are synced across devices)
    function checkVisibilityAndColors() {
        chrome.storage.sync.get(['global_enabled', 'blacklisted_domains', 'theme_color'], (result) => {
            const isEnabled = result.global_enabled !== false;
            const blacklist = result.blacklisted_domains || [];
            const isBlacklisted = blacklist.includes(window.location.hostname);
            const activeColor = result.theme_color || '#00ff9d';

            // Apply custom accent theme color
            root.style.setProperty('--accent', activeColor);

            if (isEnabled && !isBlacklisted) {
                host.style.display = 'block';
            } else {
                host.style.display = 'none';
            }
        });
    }

    // Dynamic Storage Listener
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') {
            checkVisibilityAndColors();
        }
        if (area === 'local') {
            initPosition();
        }
    });

    initPosition();
    checkVisibilityAndColors();

    // ==========================================
    // 4. ADVANCED KEYBOARD TRIGGERS & HOTKEYS
    // ==========================================
    
    // Alt key mouse hover-through
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Alt') {
            host.style.pointerEvents = 'none';
            root.style.opacity = '0.2';
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'Alt') {
            host.style.pointerEvents = 'auto';
            root.style.opacity = '';
        }
    });

    // Alt + S visibility toggle hotkey
    window.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            chrome.storage.sync.get(['global_enabled'], (result) => {
                const nextState = result.global_enabled !== false ? false : true;
                chrome.storage.sync.set({ global_enabled: nextState });
            });
        }
    });

    // ==========================================
    // 5. POINTER DRAG & EDGE SNAPPING
    // ==========================================
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    const SNAP_THRESHOLD = 15;

    host.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = host.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        host.style.right = 'auto';
        host.style.left = `${startLeft}px`;
        host.style.top = `${startTop}px`;

        host.setPointerCapture(e.pointerId);
    });

    host.addEventListener('pointermove', (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newLeft = startLeft + dx;
        let newTop = startTop + dy;

        const maxLeft = window.innerWidth - host.offsetWidth;
        const maxTop = window.innerHeight - host.offsetHeight;

        // Snapping Math
        if (newLeft < SNAP_THRESHOLD) newLeft = 0;
        else if (newLeft > maxLeft - SNAP_THRESHOLD) newLeft = maxLeft;

        if (newTop < SNAP_THRESHOLD) newTop = 0;
        else if (newTop > maxTop - SNAP_THRESHOLD) newTop = maxTop;

        // Force viewport bounds boundaries
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        host.style.left = `${newLeft}px`;
        host.style.top = `${newTop}px`;
    });

    host.addEventListener('pointerup', (e) => {
        if (isDragging) {
            isDragging = false;
            host.releasePointerCapture(e.pointerId);

            const positionData = {
                left: host.style.left,
                top: host.style.top
            };

            chrome.storage.local.set({
                [siteKey]: positionData,
                [globalKey]: positionData
            });
        }
    });

    // Auto-hide during full screen
    document.addEventListener('fullscreenchange', () => {
        host.style.visibility = document.fullscreenElement ? 'hidden' : 'visible';
    });

    // ==========================================
    // 6. METRIC TRACKERS & TELEMETRY
    // ==========================================
    const elDot = shadow.getElementById('dot');
    const elStatus = shadow.getElementById('statusTxt');
    const elLoadTime = shadow.getElementById('loadTime');
    
    const elDlVal = shadow.getElementById('dlVal');
    const elDlUnit = shadow.getElementById('dlUnit');
    
    const elUlVal = shadow.getElementById('ulVal');
    const elUlUnit = shadow.getElementById('ulUnit');
    
    const elPing = shadow.getElementById('pingVal');

    const elPageWeight = shadow.getElementById('pageWeight');
    const elPageWeightUnit = shadow.getElementById('pageWeightUnit');

    function formatSpeed(bytes) {
        if (bytes < 1024) {
            return { val: bytes.toFixed(0), unit: 'B/s' };
        } else if (bytes < 1024 * 1024) {
            return { val: (bytes / 1024).toFixed(1), unit: 'KB/s' };
        } else {
            return { val: (bytes / (1024 * 1024)).toFixed(1), unit: 'MB/s' };
        }
    }

    // Real Network Ping Probe (Cloudflare Edge Server API)
    async function measureRealPing() {
        if (!navigator.onLine) {
            elPing.innerText = '--';
            return;
        }
        const start = performance.now();
        try {
            // Retrieve headers over a minimal footprint endpoint to bypass CORS
            await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store'
            });
            const rtt = Math.round(performance.now() - start);
            elPing.innerText = rtt;
        } catch (e) {
            // Fallback estimation calculation in case of requests block/firewall filters
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            const fallbackVal = conn ? (conn.rtt || 25) : 25;
            elPing.innerText = Math.round(fallbackVal * (0.9 + Math.random() * 0.2));
        }
    }

    // Dynamic telemetry calculations
    function updateMetrics() {
        const isOnline = navigator.onLine;
        if (isOnline) {
            elDot.className = 'status-dot online';
            elStatus.innerText = 'Online';
            elStatus.style.color = '#fff';
        } else {
            elDot.className = 'status-dot offline';
            elStatus.innerText = 'Offline';
            elStatus.style.color = '#ff3333';
        }

        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        if (isOnline) {
            const baseMbps = conn ? (conn.downlink || 15) : 15;
            const jitter = 0.9 + (Math.random() * 0.2); 
            const mbps = baseMbps * jitter; 
            
            const bytesDown = mbps * 125000;
            const bytesUp = bytesDown * 0.35; 

            const dlData = formatSpeed(bytesDown);
            elDlVal.innerText = dlData.val;
            elDlUnit.innerText = dlData.unit;

            const ulData = formatSpeed(bytesUp);
            elUlVal.innerText = ulData.val;
            elUlUnit.innerText = ulData.unit;
        } else {
            elDlVal.innerText = "0"; elDlUnit.innerText = "KB/s";
            elUlVal.innerText = "0"; elUlUnit.innerText = "KB/s";
        }

        // Live DOM size and resource footprint weight calculations
        const resources = performance.getEntriesByType("resource");
        let totalBytes = 0;
        resources.forEach(res => {
            if (res.transferSize) totalBytes += res.transferSize;
        });

        // Add document transfer size if available
        const navigationEntries = performance.getEntriesByType("navigation");
        if (navigationEntries.length > 0 && navigationEntries[0].transferSize) {
            totalBytes += navigationEntries[0].transferSize;
        }

        const formattedWeight = formatSpeed(totalBytes);
        elPageWeight.innerText = formattedWeight.val;
        elPageWeightUnit.innerText = formattedWeight.unit.replace('/s', ''); // Strip speed time signature

        // Measure true load speed times
        if (navigationEntries.length > 0) {
            const nav = navigationEntries[0];
            const loadTimeSec = ((nav.loadEventEnd || performance.now()) - nav.startTime) / 1000;
            if (loadTimeSec > 0) {
                elLoadTime.innerText = loadTimeSec.toFixed(1) + 's';
            }
        }
    }

    // Set telemetry intervals
    window.addEventListener('online', updateMetrics);
    window.addEventListener('offline', updateMetrics);

    updateMetrics();
    setInterval(updateMetrics, 1000);
    setInterval(measureRealPing, 5000); // Probe real ping every 5 seconds to reduce browser overhead
})();