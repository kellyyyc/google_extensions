let tabs_time_spent = {};
let most_recent_id = null;
let most_recent_start_time = null;

const validateUrl = (url) => {
    if (!url || typeof url !== "string") {
        return "unknown";
    }

    try {
        if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
          return null;
        }
      
        const url_object = new URL(url);
        const domain = url_object.hostname || tab.url;
        return domain;
    } catch (err) {
        console.warn("Invalid URL: ", tab.url, err);
    }
}

const addUrl = (current_time) => {
    if (most_recent_id !== null && most_recent_start_time !== null) {
        chrome.tabs.get(most_recent_id, (tab) => {
            const url = tab.url;
            const name = validateUrl(url);

            if (name === null) {
                return;
            }

            if (!tabs_time_spent[name]) {
                tabs_time_spent[name] = [];
            }
      
            tabs_time_spent[name].push({
                "start": most_recent_start_time,
                "end": current_time,
            });
      
            chrome.storage.local.set({ urls_data: tabs_time_spent });
        });
    }
}

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get().then((result) => {
        const urls_data = result.urls_data;
        tabs_time_spent = urls_data || {};
    });
});

chrome.tabs.onActivated.addListener((new_tab) => {
    const new_tab_id = new_tab.tabId;
    const time_now = Date.now();

    addUrl(time_now);

    most_recent_id = new_tab_id;
    most_recent_start_time = time_now;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === most_recent_id && changeInfo.url) {
      const time_now = Date.now();
      addUrl(time_now);
      most_recent_start_time = time_now;
    }
  });

chrome.windows.onFocusChanged.addListener((window_id) => {
    const time_now = Date.now();

    if (window_id === chrome.windows.WINDOW_ID_NONE) {
        addUrl(time_now);

        most_recent_id = null;
        most_recent_start_time = null;
    } else {
        chrome.tabs.query({ active: true, windowId: window_id }, (tabs) => {
            if (tabs[0]) {
                most_recent_id = tabs[0].id;
                most_recent_start_time = time_now;
            }
        });
    }
});
