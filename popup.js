document.addEventListener('DOMContentLoaded', () => {
    const globalToggle = document.getElementById('globalToggle');
    const themeColor = document.getElementById('themeColor');
    const currentDomainEl = document.getElementById('currentDomain');
    const blockBtn = document.getElementById('blockBtn');
    const resetBtn = document.getElementById('resetBtn');

    let currentHostname = '';

    // 1. Identify current active tab domain
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
            try {
                const url = new URL(tabs[0].url);
                currentHostname = url.hostname;
                currentDomainEl.innerText = currentHostname;

                // Sync preference states
                chrome.storage.sync.get(['blacklisted_domains', 'global_enabled', 'theme_color'], (result) => {
                    const blacklist = result.blacklisted_domains || [];
                    const globalEnabled = result.global_enabled !== false; 
                    const storedColor = result.theme_color || '#00ff9d';

                    globalToggle.checked = globalEnabled;
                    themeColor.value = storedColor;

                    if (blacklist.includes(currentHostname)) {
                        blockBtn.innerText = 'Unblock On This Site';
                        blockBtn.classList.add('active');
                    } else {
                        blockBtn.innerText = 'Block On This Site';
                        blockBtn.classList.remove('active');
                    }
                });
            } catch (err) {
                currentDomainEl.innerText = 'System / Extension Page';
                blockBtn.disabled = true;
            }
        }
    });

    // 2. Enable/Disable Toggle
    globalToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ global_enabled: globalToggle.checked });
    });

    // 3. Color Theme Selector
    themeColor.addEventListener('input', () => {
        chrome.storage.sync.set({ theme_color: themeColor.value });
    });

    // 4. Blacklist domain settings
    blockBtn.addEventListener('click', () => {
        if (!currentHostname) return;

        chrome.storage.sync.get(['blacklisted_domains'], (result) => {
            let blacklist = result.blacklisted_domains || [];

            if (blacklist.includes(currentHostname)) {
                blacklist = blacklist.filter(item => item !== currentHostname);
                blockBtn.innerText = 'Block On This Site';
                blockBtn.classList.remove('active');
            } else {
                blacklist.push(currentHostname);
                blockBtn.innerText = 'Unblock On This Site';
                blockBtn.classList.add('active');
            }

            chrome.storage.sync.set({ blacklisted_domains: blacklist });
        });
    });

    // 5. Reset layouts across local storage
    resetBtn.addEventListener('click', () => {
        if (confirm('Reset widget coordinates and collapse layouts on all sites?')) {
            chrome.storage.local.clear(() => {
                alert('Positions reset successfully.');
            });
        }
    });
});