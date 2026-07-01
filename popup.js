document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. PASCALCASE DOM SELECTORS
    // ==========================================
    const MainTabBtn = document.getElementById('MainTabBtn');
    const SettingsTabBtn = document.getElementById('SettingsTabBtn');
    const ToolsTabBtn = document.getElementById('ToolsTabBtn');

    const MainTabContent = document.getElementById('MainTabContent');
    const SettingsTabContent = document.getElementById('SettingsTabContent');
    const ToolsTabContent = document.getElementById('ToolsTabContent');

    const GlobalToggle = document.getElementById('GlobalToggle');
    const ThemeColor = document.getElementById('ThemeColor');
    const CurrentDomain = document.getElementById('CurrentDomain');
    const WidgetTemplateSelect = document.getElementById('WidgetTemplateSelect');
    const BlockBtn = document.getElementById('BlockBtn');

    const BlocklistContainer = document.getElementById('BlocklistContainer');
    const CustomCssInput = document.getElementById('CustomCssInput');
    const SaveCustomWidgetBtn = document.getElementById('SaveCustomWidgetBtn');
    const ResetBtn = document.getElementById('ResetBtn');

    const RunSpeedTestBtn = document.getElementById('RunSpeedTestBtn');
    const SpeedProgressWrapper = document.getElementById('SpeedProgressWrapper');
    const SpeedProgressBar = document.getElementById('SpeedProgressBar');
    const SpeedTestResult = document.getElementById('SpeedTestResult');

    const RunPingTestBtn = document.getElementById('RunPingTestBtn');
    const PingTestResult = document.getElementById('PingTestResult');

    const RunIpLookupBtn = document.getElementById('RunIpLookupBtn');
    const IpLookupResult = document.getElementById('IpLookupResult');

    const RunCdnNodeBtn = document.getElementById('RunCdnNodeBtn');
    const CdnNodeResult = document.getElementById('CdnNodeResult');

    const RunWebSocketBtn = document.getElementById('RunWebSocketBtn');
    const WebSocketResult = document.getElementById('WebSocketResult');

    const DiagOnline = document.getElementById('DiagOnline');
    const DiagApi = document.getElementById('DiagApi');
    const DiagLatency = document.getElementById('DiagLatency');

    let ActiveHostname = '';

    // ==========================================
    // 2. TAB ROUTING ENGINE
    // ==========================================
    function SwitchTab(TargetBtn, TargetContent) {
        [MainTabBtn, SettingsTabBtn, ToolsTabBtn].forEach(Btn => {
            Btn.classList.remove('ActiveTab');
        });
        [MainTabContent, SettingsTabContent, ToolsTabContent].forEach(Content => {
            Content.classList.remove('ActiveContent');
        });

        TargetBtn.classList.add('ActiveTab');
        TargetContent.classList.add('ActiveContent');
    }

    MainTabBtn.addEventListener('click', () => SwitchTab(MainTabBtn, MainTabContent));
    SettingsTabBtn.addEventListener('click', () => {
        SwitchTab(SettingsTabBtn, SettingsTabContent);
        RenderBlocklist();
    });
    ToolsTabBtn.addEventListener('click', () => {
        SwitchTab(ToolsTabBtn, ToolsTabContent);
        RunQuickDiagnostics();
    });

    // ==========================================
    // 3. SYNCHRONIZED STORAGE PERSISTENCE
    // ==========================================
    chrome.tabs.query({ active: true, currentWindow: true }, (Tabs) => {
        if (Tabs[0] && Tabs[0].url) {
            try {
                const CurrentUrl = new URL(Tabs[0].url);
                ActiveHostname = CurrentUrl.hostname;
                CurrentDomain.innerText = ActiveHostname;

                const SiteLayoutKey = `WidgetTemplate_${ActiveHostname}`;

                // Sync global settings
                chrome.storage.sync.get(['global_enabled', 'theme_color', 'blacklisted_domains', 'CustomCss'], (SyncResult) => {
                    const GlobalEnabled = SyncResult.global_enabled !== false;
                    const StoredColor = SyncResult.theme_color || '#00ff9d';
                    const Blacklist = SyncResult.blacklisted_domains || [];

                    GlobalToggle.checked = GlobalEnabled;
                    ThemeColor.value = StoredColor;
                    CustomCssInput.value = SyncResult.CustomCss || '';

                    // Load localized template overrides (local coordinates storage)
                    chrome.storage.local.get([SiteLayoutKey], (LocalResult) => {
                        WidgetTemplateSelect.value = LocalResult[SiteLayoutKey] || 'Template1';
                    });

                    UpdateBlockButtonUI(Blacklist);
                });
            } catch (Err) {
                CurrentDomain.innerText = 'Restricted Chrome Page';
                BlockBtn.disabled = true;
                WidgetTemplateSelect.disabled = true;
            }
        }
    });

    function UpdateBlockButtonUI(Blacklist) {
        if (Blacklist.includes(ActiveHostname)) {
            BlockBtn.innerText = 'Unblock On This Site';
            BlockBtn.classList.add('ActiveState');
        } else {
            BlockBtn.innerText = 'Block On This Site';
            BlockBtn.classList.remove('ActiveState');
        }
    }

    GlobalToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ global_enabled: GlobalToggle.checked });
    });

    ThemeColor.addEventListener('input', () => {
        chrome.storage.sync.set({ theme_color: ThemeColor.value });
    });

    WidgetTemplateSelect.addEventListener('change', () => {
        if (!ActiveHostname) return;
        const SiteLayoutKey = `WidgetTemplate_${ActiveHostname}`;
        chrome.storage.local.set({ [SiteLayoutKey]: WidgetTemplateSelect.value });
    });

    BlockBtn.addEventListener('click', () => {
        if (!ActiveHostname) return;

        chrome.storage.sync.get(['blacklisted_domains'], (SyncResult) => {
            let Blacklist = SyncResult.blacklisted_domains || [];

            if (Blacklist.includes(ActiveHostname)) {
                Blacklist = Blacklist.filter(Host => Host !== ActiveHostname);
            } else {
                Blacklist.push(ActiveHostname);
            }

            chrome.storage.sync.set({ blacklisted_domains: Blacklist }, () => {
                UpdateBlockButtonUI(Blacklist);
                RenderBlocklist();
            });
        });
    });

    // ==========================================
    // 4. BLOCKLIST RENDERER & CSS EDITOR
    // ==========================================
    function RenderBlocklist() {
        chrome.storage.sync.get(['blacklisted_domains'], (SyncResult) => {
            const Blacklist = SyncResult.blacklisted_domains || [];
            BlocklistContainer.innerHTML = '';

            if (Blacklist.length === 0) {
                BlocklistContainer.innerHTML = `<div style="color: var(--TextMuted); font-size: 11px; padding: 6px; text-align: center;">No blocked sites.</div>`;
                return;
            }

            Blacklist.forEach(Host => {
                const Item = document.createElement('div');
                Item.className = 'BlocklistItem';

                const Text = document.createElement('span');
                Text.innerText = Host;
                Text.style.wordBreak = 'break-all';

                const DeleteBtn = document.createElement('button');
                DeleteBtn.className = 'Btn';
                DeleteBtn.style.padding = '2px 6px';
                DeleteBtn.style.fontSize = '10px';
                DeleteBtn.style.borderColor = 'var(--DangerColor)';
                DeleteBtn.style.color = 'var(--DangerColor)';
                DeleteBtn.innerText = 'Remove';

                DeleteBtn.addEventListener('click', () => {
                    const UpdatedList = Blacklist.filter(Item => Item !== Host);
                    chrome.storage.sync.set({ blacklisted_domains: UpdatedList }, () => {
                        RenderBlocklist();
                        if (Host === ActiveHostname) {
                            UpdateBlockButtonUI(UpdatedList);
                        }
                    });
                });

                Item.appendChild(Text);
                Item.appendChild(DeleteBtn);
                BlocklistContainer.appendChild(Item);
            });
        });
    }

    SaveCustomWidgetBtn.addEventListener('click', () => {
        chrome.storage.sync.set({ CustomCss: CustomCssInput.value }, () => {
            alert('Custom CSS Saved. Refresh active pages to apply styling overrides.');
        });
    });

    ResetBtn.addEventListener('click', () => {
        if (confirm('Reset layouts and coordinate positions across all sites?')) {
            chrome.storage.local.clear(() => {
                alert('Layout position mappings cleared.');
            });
        }
    });

    // ==========================================
    // 5. DIAGNOSTICS & TELEMETRY SUITE
    // ==========================================

    // TOOL 1: Raw Throughput Download Speed Test
    RunSpeedTestBtn.addEventListener('click', async () => {
        RunSpeedTestBtn.disabled = true;
        RunSpeedTestBtn.innerHTML = `<span class="Spinner"></span> Testing...`;
        SpeedProgressWrapper.style.display = 'block';
        SpeedProgressBar.style.width = '0%';
        SpeedTestResult.innerText = 'Contacting download nodes...';

        const TargetUrl = 'https://www.cloudflare.com/favicon.ico'; // [1]
        const Iterations = 8;
        let TotalBytes = 0;
        let TotalTime = 0;

        try {
            for (let I = 0; I < Iterations; I++) {
                const StartTime = performance.now();
                const Response = await fetch(`${TargetUrl}?nocache=${Math.random()}`, { cache: 'no-store' });
                const Blob = await Response.blob();
                const EndTime = performance.now();

                TotalBytes += Blob.size;
                TotalTime += (EndTime - StartTime) / 1000;

                const CompletionPercent = Math.round(((I + 1) / Iterations) * 100);
                SpeedProgressBar.style.width = `${CompletionPercent}%`;
                SpeedTestResult.innerText = `Chunk test ${I + 1} of ${Iterations}...`;
            }

            const Bps = TotalBytes / TotalTime;
            const Mbps = (Bps * 8) / (1024 * 1024);
            SpeedTestResult.innerText = `Complete: ${Mbps.toFixed(2)} Mbps (unthrottled raw run)`;
        } catch (Err) {
            SpeedTestResult.innerText = 'Throughput diagnostics failed.';
            SpeedProgressBar.style.backgroundColor = 'var(--DangerColor)';
        } finally {
            RunSpeedTestBtn.disabled = false;
            RunSpeedTestBtn.innerText = 'Start Test';
        }
    });

    // TOOL 2: Latency & Jitter Probe
    RunPingTestBtn.addEventListener('click', async () => {
        RunPingTestBtn.disabled = true;
        RunPingTestBtn.innerHTML = `<span class="Spinner"></span> Testing...`;
        PingTestResult.innerText = 'Probing latency metrics...';

        const TargetUrl = 'https://www.cloudflare.com/cdn-cgi/trace'; // [1]
        const PingIterations = 10;
        const Latencies = [];

        try {
            for (let I = 0; I < PingIterations; I++) {
                const StartTime = performance.now();
                await fetch(`${TargetUrl}?nocache=${Math.random()}`, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-store'
                });
                const EndTime = performance.now();
                Latencies.push(EndTime - StartTime);
                PingTestResult.innerText = `Probe ${I + 1} of ${PingIterations}...`;
                await new Promise(Resolve => setTimeout(Resolve, 120));
            }

            const AvgPing = Latencies.reduce((A, B) => A + B, 0) / Latencies.length;
            const MaxPing = Math.max(...Latencies);
            const MinPing = Math.min(...Latencies);

            const SquaredDiffs = Latencies.map(Val => Math.pow(Val - AvgPing, 2));
            const Jitter = Math.sqrt(SquaredDiffs.reduce((A, B) => A + B, 0) / Latencies.length);

            PingTestResult.innerHTML = `
                Avg Latency: <strong>${Math.round(AvgPing)} ms</strong><br>
                Deviation/Jitter: <strong>±${Jitter.toFixed(1)} ms</strong><br>
                Route Delta: <strong>${Math.round(MinPing)} - ${Math.round(MaxPing)} ms</strong>
            `;
        } catch (Err) {
            PingTestResult.innerText = 'Ping diagnostics unreachable.';
        } finally {
            RunPingTestBtn.disabled = false;
            RunPingTestBtn.innerText = 'Test Latency';
        }
    });

    // TOOL 3: Router Public IP Resolver
    RunIpLookupBtn.addEventListener('click', async () => {
        RunIpLookupBtn.disabled = true;
        RunIpLookupBtn.innerHTML = `<span class="Spinner"></span> Resolving...`;
        IpLookupResult.innerText = 'Fetching routing IP...';

        try {
            const Response = await fetch('https://api.ipify.org?format=json');
            const Payload = await Response.json();

            const InfoResponse = await fetch(`https://ipinfo.io/${Payload.ip}/json`);
            if (InfoResponse.ok) {
                const Info = await InfoResponse.json();
                IpLookupResult.innerHTML = `
                    IP: <strong>${Info.ip}</strong><br>
                    ISP: <strong>${Info.org || 'Unknown Provider'}</strong><br>
                    Location: <strong>${Info.city || ''}, ${Info.country || ''}</strong>
                `;
            } else {
                IpLookupResult.innerHTML = `IP: <strong>${Payload.ip}</strong> (Location details unavailable).`;
            }
        } catch (Err) {
            IpLookupResult.innerText = 'IP Resolution failed.';
        } finally {
            RunIpLookupBtn.disabled = false;
            RunIpLookupBtn.innerText = 'Query IP';
        }
    });

    // TOOL 4: CDN Node Location Finder [1]
    RunCdnNodeBtn.addEventListener('click', async () => {
        RunCdnNodeBtn.disabled = true;
        RunCdnNodeBtn.innerHTML = `<span class="Spinner"></span> Mapping...`;
        CdnNodeResult.innerText = 'Querying edge nodes...';

        const NodeAirportMap = {
            'JFK': 'New York City, USA',
            'LHR': 'London, UK',
            'SIN': 'Singapore',
            'HKG': 'Hong Kong',
            'NRT': 'Tokyo, Japan',
            'FRA': 'Frankfurt, Germany',
            'AMS': 'Amsterdam, Netherlands',
            'DXB': 'Dubai, UAE',
            'CDG': 'Paris, France',
            'SFO': 'San Francisco, USA',
            'LAX': 'Los Angeles, USA',
            'SYD': 'Sydney, Australia'
        };

        try {
            const Response = await fetch('https://www.cloudflare.com/cdn-cgi/trace'); // [1]
            const Text = await Response.text();

            // Extract colo=XXX key [1]
            const ColoLine = Text.split('\n').find(Line => Line.startsWith('colo='));
            if (ColoLine) {
                const ColoCode = ColoLine.split('=')[1].toUpperCase();
                const CityMapping = NodeAirportMap[ColoCode] || 'Unknown Geographic Node';
                CdnNodeResult.innerHTML = `
                    Node Code: <strong>${ColoCode}</strong><br>
                    Nearest City: <strong>${CityMapping}</strong>
                `;
            } else {
                CdnNodeResult.innerText = 'Colocation metadata key missing from payload trace.';
            }
        } catch (Err) {
            CdnNodeResult.innerText = 'Unable to reach nearest edge diagnostic cluster.';
        } finally {
            RunCdnNodeBtn.disabled = false;
            RunCdnNodeBtn.innerText = 'Locate Node';
        }
    });

    // TOOL 5: WebSocket Real-Time Handshake Audit
    RunWebSocketBtn.addEventListener('click', () => {
        RunWebSocketBtn.disabled = true;
        RunWebSocketBtn.innerHTML = `<span class="Spinner"></span> Auditing...`;
        WebSocketResult.innerText = 'Initiating WSS handshake...';

        // Connects to a reliable secure postman echo websocket gateway
        const SocketAddress = 'wss://ws.postman-echo.com/raw';
        let SocketInstance;

        try {
            const ConnectionTimer = setTimeout(() => {
                if (SocketInstance) SocketInstance.close();
                WebSocketResult.innerHTML = 'Status: <span style="color: var(--DangerColor)">BLOCKED</span> (Connection timeout)';
                RunWebSocketBtn.disabled = false;
                RunWebSocketBtn.innerText = 'Verify WS';
            }, 4000);

            SocketInstance = new WebSocket(SocketAddress);

            SocketInstance.onopen = () => {
                clearTimeout(ConnectionTimer);
                WebSocketResult.innerHTML = 'Status: <span style="color: var(--AccentColor)">ACTIVE / WEB SOCKETS ALLOWED</span>';
                SocketInstance.close();
                RunWebSocketBtn.disabled = false;
                RunWebSocketBtn.innerText = 'Verify WS';
            };

            SocketInstance.onerror = () => {
                clearTimeout(ConnectionTimer);
                WebSocketResult.innerHTML = 'Status: <span style="color: var(--DangerColor)">BLOCKED / FIREWALL FILTER</span>';
                RunWebSocketBtn.disabled = false;
                RunWebSocketBtn.innerText = 'Verify WS';
            };
        } catch (Err) {
            WebSocketResult.innerText = 'Socket client construction error.';
            RunWebSocketBtn.disabled = false;
            RunWebSocketBtn.innerText = 'Verify WS';
        }
    });

    // TOOL 6: System Log Diagnostic checks
    async function RunQuickDiagnostics() {
        const IsOnline = navigator.onLine;
        DiagOnline.innerText = `Browser Status: ${IsOnline ? 'ONLINE' : 'OFFLINE'}`;
        DiagOnline.style.color = IsOnline ? 'var(--AccentColor)' : 'var(--DangerColor)';

        const Conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (Conn) {
            DiagApi.innerText = `Connection Class: ${Conn.effectiveType || 'unknown'} (${Conn.downlink || '0'} Mbps limit)`;
            DiagApi.style.color = 'var(--TextColor)';
        } else {
            DiagApi.innerText = 'Connection API: Unsupported Platform';
            DiagApi.style.color = 'var(--TextMuted)';
        }

        DiagLatency.innerText = 'Benchmarking CDN latency...';
        DiagLatency.style.color = 'var(--TextMuted)';
        try {
            const Start = performance.now();
            await fetch('https://www.cloudflare.com/cdn-cgi/trace', { method: 'HEAD', mode: 'no-cors' }); // [1]
            const Rtt = Math.round(performance.now() - Start);
            DiagLatency.innerText = `CDN Latency: ${Rtt} ms (Target Node)`;
            DiagLatency.style.color = Rtt < 100 ? 'var(--AccentColor)' : '#ffcc00';
        } catch (Err) {
            DiagLatency.innerText = 'CDN Latency: Servers offline or unreachable.';
            DiagLatency.style.color = 'var(--DangerColor)';
        }
    }
});