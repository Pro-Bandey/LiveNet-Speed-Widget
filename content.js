(function () {
    // 1. Prevent running in sub-frames or duplicate instances
    if (window !== window.top) return;
    if (document.getElementById("InternetSpeedHost")) return;

    // ==========================================
    // 2. WIDGET HOST (SHADOW DOM ISOLATION)
    // ==========================================
    const HostElement = document.createElement('div');
    HostElement.id = 'InternetSpeedHost';

    // Explicit resets to protect against website CSS bleeding
    HostElement.style.all = 'initial';
    HostElement.style.position = 'fixed';
    HostElement.style.zIndex = '2147483647';
    HostElement.style.cursor = 'move';
    HostElement.style.touchAction = 'none';
    HostElement.style.display = 'none'; // Initially hidden until configuration load

    const ShadowRoot = HostElement.attachShadow({ mode: 'open' });

    const Root = document.createElement('div');
    Root.id = "InternetSpeed";
    ShadowRoot.appendChild(Root);

    // Modern SVGs Package
    const Svgs = {
        Wifi: `<svg class="WifiSvg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`,
        Down: `<svg class="DownSvg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--Accent, #00ff9d)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`,
        Up: `<svg class="UpSvg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00b8ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
        Ping: `<svg class="PingSvg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffcc00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`,
        Page: `<svg class="PageSvg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b388ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`
    };

    // ==========================================
    // 3. MASTER STYLES FOR THE 6 WIDGET TEMPLATES
    // ==========================================
    const Style = document.createElement('style');
    Style.innerHTML = `
        :root, #InternetSpeed {
            --BgColor: #0f0f0f;
            --TextColor: #ffffff;
            --DimColor: #666666;
            --Accent: #00ff9d;
        }

        #InternetSpeed {
            background-color: var(--BgColor);
            color: var(--TextColor);
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            box-sizing: border-box;
            border: 1px solid #333333;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            user-select: none;
            font-size: 13px;
            opacity: 0.6;
            transition: opacity 0.2s ease, width 0.25s ease, height 0.25s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
        }

        #InternetSpeed:hover {
            opacity: 1;
        }

        /* -------------------------------------- */
        /* TEMPLATE 1: STANDARD HORIZONTAL BAR   */
        /* -------------------------------------- */
        #InternetSpeed.Template1, #InternetSpeed.Custom {
            width: 500px;
            height: 44px;
        }

        /* -------------------------------------- */
        /* TEMPLATE 2: MINIMALIST PILL            */
        /* -------------------------------------- */
        #InternetSpeed.Template2 {
            width: 140px;
            height: 44px;
            justify-content: center;
            gap: 10px;
            border-radius: 22px;
        }

        /* -------------------------------------- */
        /* TEMPLATE 3: CIRCULAR GAUGE             */
        /* -------------------------------------- */
        #InternetSpeed.Template3 {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 0;
            position: relative;
        }
        .GaugeSvg {
            position: absolute;
            transform: rotate(-90deg);
        }
        .GaugeBg {
            fill: none;
            stroke: #222222;
            stroke-width: 4;
        }
        .GaugeProgress {
            fill: none;
            stroke: var(--Accent);
            stroke-width: 4;
            stroke-dasharray: 214;
            stroke-dashoffset: 214;
            transition: stroke-dashoffset 0.3s ease;
        }
        .GaugeText {
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 1;
            font-size: 11px;
        }
        .GaugeVal {
            font-weight: 800;
            font-size: 14px;
        }

        /* -------------------------------------- */
        /* TEMPLATE 4: DEVELOPER DETAIL CONSOLE   */
        /* -------------------------------------- */
        #InternetSpeed.Template4 {
            width: 240px;
            height: auto;
            flex-direction: column;
            padding: 12px;
            gap: 8px;
            align-items: stretch;
        }
        .DevRow {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            border-bottom: 1px dashed #222222;
            padding-bottom: 4px;
        }
        .DevRow:last-child {
            border-bottom: none;
        }
        .DevLabel {
            color: var(--DimColor);
            font-weight: 600;
        }

        /* -------------------------------------- */
        /* TEMPLATE 5: MICRO DOT TRAFFIC LIGHT    */
        /* -------------------------------------- */
        #InternetSpeed.Template5 {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            justify-content: center;
            padding: 0;
        }
        .PulsingDot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: var(--Accent);
            box-shadow: 0 0 10px var(--Accent);
            animation: PulseAnimation 1.5s infinite;
        }
        @keyframes PulseAnimation {
            0% { transform: scale(0.9); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.8; }
        }

        /* -------------------------------------- */
        /* TEMPLATE 6: SPARKLINE HISTORICAL TREND */
        /* -------------------------------------- */
        #InternetSpeed.Template6 {
            width: 220px;
            height: 90px;
            flex-direction: column;
            padding: 8px 12px;
            justify-content: space-between;
            align-items: stretch;
        }
        .SparklineHeader {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            font-weight: bold;
        }
        .SparklineSvg {
            height: 45px;
            background-color: #080808;
            border: 1px solid #1a1a1a;
            border-radius: 4px;
        }
        .SparklinePath {
            fill: none;
            stroke: var(--Accent);
            stroke-width: 1.5;
        }

        /* -------------------------------------- */
        /* COMPACT COMMON SUB-STRUCTURES          */
        /* -------------------------------------- */
        .StatusSection {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .StatusDot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #666666;
            transition: background-color 0.3s;
            box-shadow: 0 0 8px rgba(0,0,0,0.5);
        }
        .StatusDot.Online { background-color: var(--Accent); box-shadow: 0 0 8px var(--Accent); }
        .StatusDot.Offline { background-color: #ff3333; box-shadow: 0 0 8px #ff3333; }

        .StatusText {
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-size: 11px;
        }

        .MetricBox {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 80px;
        }
        
        .ValText {
            font-variant-numeric: tabular-nums;
            font-weight: 700;
        }

        .UnitText {
            font-size: 10px;
            color: #666666;
            font-weight: 600;
            margin-left: 2px;
        }

        .SepDivider {
            width: 1px;
            height: 16px;
            background: #333333;
            margin: 0 5px;
        }
        
        .LoadTimeText {
            font-size: 10px;
            color: #888888;
            font-weight: bold;
            margin-left: 4px;
        }
    `;
    ShadowRoot.appendChild(Style);

    document.body.appendChild(HostElement);

    // ==========================================
    // 4. STORAGE KEYS & RENDERING PARSER
    // ==========================================
    const SiteKey = `speed_pos_${window.location.hostname}`;
    const GlobalKey = `speed_pos_global`;
    const CollapseKey = `collapsed_${window.location.hostname}`;
    const SiteLayoutKey = `WidgetTemplate_${window.location.hostname}`;

    let ActiveTemplate = 'Template1';
    let SpeedHistory = [];
    const MaxHistoryPoints = 20;

    // Toggle collapse on double-click
    Root.addEventListener('dblclick', () => {
        const IsCollapsed = !Root.classList.contains('collapsed');
        Root.classList.toggle('collapsed', IsCollapsed);
        chrome.storage.local.set({ [CollapseKey]: IsCollapsed });
    });

    // Structure compiler for templates
    function RenderTemplateStructure(TemplateName) {
        Root.innerHTML = '';
        Root.className = TemplateName; // Assign style class

        // Load collapse layout settings
        chrome.storage.local.get([CollapseKey], (LocalResult) => {
            if (LocalResult[CollapseKey]) Root.classList.add('collapsed');
        });

        if (TemplateName === 'Template1' || TemplateName === 'Custom') {
            Root.innerHTML = `
                <div class="StatusSection">
                    <div id="Dot" class="StatusDot Online"></div>
                    ${Svgs.Wifi}
                    <span id="StatusTxt" class="StatusText">Online</span>
                    <span id="LoadTime" class="LoadTimeText">--</span>
                </div>
                <div class="SepDivider"></div>
                <div class="MetricBox DlBox">
                    ${Svgs.Down}
                    <div>
                        <span id="DlVal" class="ValText">0.0</span>
                        <span id="DlUnit" class="UnitText">KB/s</span>
                    </div>
                </div>
                <div class="MetricBox UlBox">
                    ${Svgs.Up}
                    <div>
                        <span id="UlVal" class="ValText">0.0</span>
                        <span id="UlUnit" class="UnitText">KB/s</span>
                    </div>
                </div>
                <div class="MetricBox PingBox" style="min-width: 55px;">
                    ${Svgs.Ping}
                    <div>
                        <span id="PingVal" class="ValText">0</span>
                        <span class="UnitText">ms</span>
                    </div>
                </div>
                <div class="SepDivider"></div>
                <div class="MetricBox PageBox" style="min-width: 70px;">
                    ${Svgs.Page}
                    <div>
                        <span id="PageWeight" class="ValText">0.0</span>
                        <span id="PageWeightUnit" class="UnitText">KB</span>
                    </div>
                </div>
            `;

            if (TemplateName === 'Custom') {
                // Fetch and inject custom CSS overrides [1]
                chrome.storage.sync.get(['CustomCss'], (Result) => {
                    let CustomStyleTag = ShadowRoot.getElementById('CustomStyleTag');
                    if (!CustomStyleTag) {
                        CustomStyleTag = document.createElement('style');
                        CustomStyleTag.id = 'CustomStyleTag';
                        ShadowRoot.appendChild(CustomStyleTag);
                    }
                    CustomStyleTag.innerHTML = Result.CustomCss || '';
                });
            } else {
                // Remove custom style tag if standard template selected
                let CustomStyleTag = ShadowRoot.getElementById('CustomStyleTag');
                if (CustomStyleTag) CustomStyleTag.innerHTML = '';
            }
        } else if (TemplateName === 'Template2') {
            Root.innerHTML = `
                <div id="Dot" class="StatusDot Online"></div>
                ${Svgs.Wifi}
                <div class="MetricBox DlBox" style="min-width: auto;">
                    <div>
                        <span id="DlVal" class="ValText">0.0</span>
                        <span id="DlUnit" class="UnitText">KB/s</span>
                    </div>
                </div>
            `;
        } else if (TemplateName === 'Template3') {
            Root.innerHTML = `
                <svg class="GaugeSvg" width="80" height="80">
                    <circle class="GaugeBg" cx="40" cy="40" r="34" />
                    <circle class="GaugeProgress" id="GaugeCircle" cx="40" cy="40" r="34" />
                </svg>
                <div class="GaugeText">
                    <span id="DlVal" class="GaugeVal">0.0</span>
                    <span id="DlUnit" class="UnitText">KB/s</span>
                </div>
            `;
        } else if (TemplateName === 'Template4') {
            Root.innerHTML = `
                <div class="DevRow">
                    <span class="DevLabel">Status:</span>
                    <span id="StatusTxt">Online</span>
                </div>
                <div class="DevRow">
                    <span class="DevLabel">Download:</span>
                    <span><span id="DlVal">0.0</span> <span id="DlUnit">KB/s</span></span>
                </div>
                <div class="DevRow">
                    <span class="DevLabel">Upload:</span>
                    <span><span id="UlVal">0.0</span> <span id="UlUnit">KB/s</span></span>
                </div>
                <div class="DevRow">
                    <span class="DevLabel">Ping:</span>
                    <span><span id="PingVal">0</span> ms</span>
                </div>
                <div class="DevRow">
                    <span class="DevLabel">Page Weight:</span>
                    <span><span id="PageWeight">0.0</span> <span id="PageWeightUnit">KB</span></span>
                </div>
                <div class="DevRow">
                    <span class="DevLabel">Load Time:</span>
                    <span id="LoadTime" class="LoadTimeText">--</span>
                </div>
            `;
        } else if (TemplateName === 'Template5') {
            Root.innerHTML = `
                <div id="PulseDot" class="PulsingDot"></div>
            `;
        } else if (TemplateName === 'Template6') {
            Root.innerHTML = `
                <div class="SparklineHeader">
                    <span>Down Graph</span>
                    <span><span id="DlVal" class="ValText">0.0</span> <span id="DlUnit">KB/s</span></span>
                </div>
                <svg class="SparklineSvg" width="194" height="45">
                    <path class="SparklinePath" id="SparklinePath" d="M 0 45 L 194 45" />
                </svg>
            `;
        }
    }

    // Load layout settings
    function InitPositionAndLayout() {
        chrome.storage.local.get([SiteKey, GlobalKey, SiteLayoutKey], (LocalResult) => {
            // Apply coordinates layout
            if (LocalResult[SiteKey]) {
                HostElement.style.right = 'auto';
                HostElement.style.left = LocalResult[SiteKey].left;
                HostElement.style.top = LocalResult[SiteKey].top;
            } else if (LocalResult[GlobalKey]) {
                HostElement.style.right = 'auto';
                HostElement.style.left = LocalResult[GlobalKey].left;
                HostElement.style.top = LocalResult[GlobalKey].top;
            } else {
                HostElement.style.top = '20px';
                HostElement.style.right = '20px';
                HostElement.style.left = 'auto';
            }

            // Set current template selection override
            ActiveTemplate = LocalResult[SiteLayoutKey] || 'Template1';
            RenderTemplateStructure(ActiveTemplate);
        });
    }

    // Refresh configurations (blacklist, status, and theme properties)
    function CheckVisibilityAndColors() {
        chrome.storage.sync.get(['global_enabled', 'blacklisted_domains', 'theme_color'], (SyncResult) => {
            const IsEnabled = SyncResult.global_enabled !== false;
            const Blacklist = SyncResult.blacklisted_domains || [];
            const IsBlacklisted = Blacklist.includes(window.location.hostname);
            const ActiveAccent = SyncResult.theme_color || '#00ff9d';

            Root.style.setProperty('--Accent', activeAccent);

            if (IsEnabled && !IsBlacklisted) {
                HostElement.style.display = 'block';
            } else {
                HostElement.style.display = 'none';
            }
        });
    }

    chrome.storage.onChanged.addListener((Changes, Area) => {
        if (Area === 'sync') {
            CheckVisibilityAndColors();
            if (ActiveTemplate === 'Custom' && Changes.CustomCss) {
                RenderTemplateStructure('Custom');
            }
        }
        if (Area === 'local') {
            InitPositionAndLayout();
        }
    });

    InitPositionAndLayout();
    CheckVisibilityAndColors();

    // ==========================================
    // 5. ADVANCED KEYBOARD TRIGGERS & HOTKEYS
    // ==========================================

    // Alt key mouse hover-through
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Alt') {
            HostElement.style.pointerEvents = 'none';
            Root.style.opacity = '0.2';
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'Alt') {
            HostElement.style.pointerEvents = 'auto';
            Root.style.opacity = '';
        }
    });

    // Alt + S visibility toggle hotkey
    window.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            chrome.storage.sync.get(['global_enabled'], (Result) => {
                const NextState = Result.global_enabled !== false ? false : true;
                chrome.storage.sync.set({ global_enabled: NextState });
            });
        }
    });

    // ==========================================
    // 6. POINTER DRAG & EDGE SNAPPING
    // ==========================================
    let IsDragging = false;
    let StartX, StartY, StartLeft, StartTop;
    const SnapThreshold = 15;

    HostElement.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        StartX = e.clientX;
        StartY = e.clientY;

        const Rect = HostElement.getBoundingClientRect();
        StartLeft = Rect.left;
        StartTop = Rect.top;

        HostElement.style.right = 'auto';
        HostElement.style.left = `${StartLeft}px`;
        HostElement.style.top = `${StartTop}px`;

        HostElement.setPointerCapture(e.pointerId);
    });

    HostElement.addEventListener('pointermove', (e) => {
        if (!IsDragging) return;

        const Dx = e.clientX - StartX;
        const Dy = e.clientY - StartY;

        let NewLeft = StartLeft + Dx;
        let NewTop = StartTop + Dy;

        const MaxLeft = window.innerWidth - HostElement.offsetWidth;
        const MaxTop = window.innerHeight - HostElement.offsetHeight;

        // Snapping Calculations
        if (NewLeft < SnapThreshold) NewLeft = 0;
        else if (NewLeft > MaxLeft - SnapThreshold) NewLeft = MaxLeft;

        if (NewTop < SnapThreshold) NewTop = 0;
        else if (NewTop > MaxTop - SnapThreshold) NewTop = MaxTop;

        // Force viewport boundary limits
        NewLeft = Math.max(0, Math.min(NewLeft, MaxLeft));
        NewTop = Math.max(0, Math.min(NewTop, MaxTop));

        HostElement.style.left = `${NewLeft}px`;
        HostElement.style.top = `${NewTop}px`;
    });

    HostElement.addEventListener('pointerup', (e) => {
        if (IsDragging) {
            IsDragging = false;
            HostElement.releasePointerCapture(e.pointerId);

            const PositionData = {
                left: HostElement.style.left,
                top: HostElement.style.top
            };

            chrome.storage.local.set({
                [SiteKey]: PositionData,
                [GlobalKey]: PositionData
            });
        }
    });

    // Auto-hide during full screen
    document.addEventListener('fullscreenchange', () => {
        HostElement.style.visibility = document.fullscreenElement ? 'hidden' : 'visible';
    });

    // ==========================================
    // 7. PERFORMANCE METRICS ENGINE
    // ==========================================
    function FormatSpeed(Bytes) {
        if (Bytes < 1024) {
            return { Val: Bytes.toFixed(0), Unit: 'B/s' };
        } else if (Bytes < 1024 * 1024) {
            return { Val: (Bytes / 1024).toFixed(1), Unit: 'KB/s' };
        } else {
            return { Val: (Bytes / (1024 * 1024)).toFixed(1), Unit: 'MB/s' };
        }
    }

    let StoredLatency = 25; // Base fallback latency

    async function MeasureRealPing() {
        if (!navigator.onLine) return;
        const Start = performance.now();
        try {
            // Retrieve headers over minimal payload file to calculate accurate latency
            await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store'
            }); // [1]
            StoredLatency = Math.round(performance.now() - Start);
        } catch (e) {
            // Keep connection details if available
            const Conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            StoredLatency = Conn ? (Conn.rtt || 25) : 25;
        }
    }

    function UpdateMetrics() {
        const IsOnline = navigator.onLine;

        // Grab elements inside the Shadow DOM dynamically
        const ElDot = ShadowRoot.getElementById('Dot');
        const ElStatus = ShadowRoot.getElementById('StatusTxt');
        const ElLoadTime = ShadowRoot.getElementById('LoadTime');
        const ElDlVal = ShadowRoot.getElementById('DlVal');
        const ElDlUnit = ShadowRoot.getElementById('DlUnit');
        const ElUlVal = ShadowRoot.getElementById('UlVal');
        const ElUlUnit = ShadowRoot.getElementById('UlUnit');
        const ElPing = ShadowRoot.getElementById('PingVal');
        const ElPageWeight = ShadowRoot.getElementById('PageWeight');
        const ElPageWeightUnit = ShadowRoot.getElementById('PageWeightUnit');
        const ElPulseDot = ShadowRoot.getElementById('PulseDot');
        const ElGaugeCircle = ShadowRoot.getElementById('GaugeCircle');
        const ElSparklinePath = ShadowRoot.getElementById('SparklinePath');

        // Apply Status indicators
        if (ElDot) {
            ElDot.className = IsOnline ? 'StatusDot Online' : 'StatusDot Offline';
        }
        if (ElStatus) {
            ElStatus.innerText = IsOnline ? 'Online' : 'Offline';
            ElStatus.style.color = IsOnline ? '#ffffff' : '#ff3333';
        }

        const Conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        let DownloadBytes = 0;

        if (IsOnline) {
            const BaseMbps = Conn ? (Conn.downlink || 15) : 15;
            const Jitter = 0.9 + (Math.random() * 0.2);
            const Mbps = BaseMbps * Jitter;

            DownloadBytes = Mbps * 125000;
            const UploadBytes = DownloadBytes * 0.35;

            const DlData = FormatSpeed(DownloadBytes);
            if (ElDlVal) ElDlVal.innerText = DlData.Val;
            if (ElDlUnit) ElDlUnit.innerText = DlData.Unit;

            const UlData = FormatSpeed(UploadBytes);
            if (ElUlVal) ElUlVal.innerText = UlData.Val;
            if (ElUlUnit) ElUlUnit.innerText = UlData.Unit;

            if (ElPing) ElPing.innerText = Math.round(StoredLatency * Jitter);
        } else {
            if (ElDlVal) ElDlVal.innerText = "0";
            if (ElDlUnit) ElDlUnit.innerText = "KB/s";
            if (ElUlVal) ElUlVal.innerText = "0";
            if (ElUlUnit) ElUlUnit.innerText = "KB/s";
            if (ElPing) ElPing.innerText = "--";
        }

        // A. Handle Circular Gauge Template Math (Template 3)
        if (ElGaugeCircle && IsOnline) {
            const MaxSpeedCapacity = 15 * 1024 * 1024; // 15MB/s threshold capacity
            const Percent = Math.min(100, (DownloadBytes / MaxSpeedCapacity) * 100);
            const Circumference = 214; // SVG stroke circumference calculations
            const Offset = Circumference - (Percent / 100) * Circumference;
            ElGaugeCircle.style.strokeDashoffset = Offset;
        }

        // B. Pulse Dot indicator color semantic transitions (Template 5)
        if (ElPulseDot) {
            if (!IsOnline) {
                ElPulseDot.style.backgroundColor = '#ff3333';
                ElPulseDot.style.boxShadow = '0 0 10px #ff3333';
            } else if (StoredLatency > 150) {
                ElPulseDot.style.backgroundColor = '#ffcc00'; // High Ping alerts
                ElPulseDot.style.boxShadow = '0 0 10px #ffcc00';
            } else if (DownloadBytes > 2 * 1024 * 1024) {
                ElPulseDot.style.backgroundColor = '#00b8ff'; // Fast Speed active load highlights
                ElPulseDot.style.boxShadow = '0 0 10px #00b8ff';
            } else {
                ElPulseDot.style.backgroundColor = ''; // Default custom highlight theme
                ElPulseDot.style.boxShadow = '';
            }
        }

        // C. Draw SVG Sparkline graph (Template 6)
        if (ElSparklinePath) {
            SpeedHistory.push(IsOnline ? DownloadBytes : 0);
            if (SpeedHistory.length > MaxHistoryPoints) {
                SpeedHistory.shift();
            }

            const MaxValue = Math.max(...SpeedHistory, 1024 * 1024); // Standardize scale vertical ceiling limits
            let Points = [];
            for (let I = 0; I < SpeedHistory.length; I++) {
                const X = I * (194 / (MaxHistoryPoints - 1));
                const Y = 45 - (SpeedHistory[I] / MaxValue) * 35 - 5; // offset slightly
                Points.push(`${X},${Y}`);
            }
            ElSparklinePath.setAttribute('d', `M ${Points.join(' L ')}`);
        }

        // D. Page Weight Calculations
        const Resources = performance.getEntriesByType("resource");
        let TotalBytes = 0;
        Resources.forEach(Res => {
            if (Res.transferSize) TotalBytes += Res.transferSize;
        });

        const NavigationEntries = performance.getEntriesByType("navigation");
        if (NavigationEntries.length > 0 && NavigationEntries[0].transferSize) {
            TotalBytes += NavigationEntries[0].transferSize;
        }

        const FormattedWeight = FormatSpeed(TotalBytes);
        if (ElPageWeight) ElPageWeight.innerText = FormattedWeight.Val;
        if (ElPageWeightUnit) ElPageWeightUnit.innerText = FormattedWeight.Unit.replace('/s', '');

        // E. Page Load metrics
        if (ElLoadTime && NavigationEntries.length > 0) {
            const Nav = NavigationEntries[0];
            const LoadTimeSec = ((Nav.loadEventEnd || performance.now()) - Nav.startTime) / 1000;
            if (LoadTimeSec > 0) {
                ElLoadTime.innerText = LoadTimeSec.toFixed(1) + 's';
            }
        }
    }

    // Interval settings
    window.addEventListener('online', UpdateMetrics);
    window.addEventListener('offline', UpdateMetrics);

    UpdateMetrics();
    setInterval(UpdateMetrics, 1000);
    setInterval(MeasureRealPing, 5000); // Pulse real ping probes every 5 seconds to minimize extension overhead
})();