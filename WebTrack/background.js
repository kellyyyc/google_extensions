const DEFAULT_SETTINGS = {
  dark_mode: "off",
  full_url: "off",
};

const getCurrentUrlId = async () => {
  const result = await chrome.storage.local.get("current_url_id");
  return result.current_url_id ?? null;
};

const setCurrentUrlId = async (new_id) => {
  await chrome.storage.local.set({ current_url_id: new_id });
};

const getCurrentUrlStartTime = async () => {
  const result = await chrome.storage.local.get("current_url_start_time");
  return result.current_url_start_time ?? null;
};

const setCurrentUrlStartTime = async (time) => {
  await chrome.storage.local.set({ current_url_start_time: time });
};

const getDomains = async () => {
  const result = await chrome.storage.local.get("domainVisits");
  return result.domainVisits ?? null;
};

const getSettings = async () => {
  const result = await chrome.storage.local.get("settings");
  return result.settings ?? null;
};

const getVisitsByDate = async (date) => {
  const result = await chrome.storage.local.get("visits");
  if (Object.keys(result.visits).length === 0) {
    return null;
  }

  return result.visits[date] ?? null;
};

const getAllVisits = async () => {
  const result = await chrome.storage.local.get("visits");
  return result.visits ?? null;
};

const getTabById = async (tabId) => {
  return await new Promise((resolve, reject) => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(tab);
      }
    });
  });
};

const queryActiveTab = async (windowId) => {
  return await new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, windowId }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      resolve(tabs);
    });
  });
};

/**
 * checks if url is a website
 */
const validateUrl = (url) => {
  if (!url || typeof url !== "string") {
    return "unknown";
  }

  try {
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
      return null;
    }

    // checks if it is a valid url
    const url_object = new URL(url);

    return url_object.hostname;
  } catch (err) {
    console.warn("Invalid URL: ", url_object.hostname, err);
  }
};

/**
 * adds url by using the current time and the start time
 */
const addUrl = async (prev_id, start_time, end_time) => {
  if (prev_id === null || start_time === null) {
    return;
  }
  try {
    const tab = await getTabById(prev_id);
    const url = tab.url;
    const name = validateUrl(url);
    if (name === null) {
      return;
    }

    const time = Date.now();
    const current_date = new Date(time).toLocaleDateString();
    let domains = await getDomains();
    if (!domains[name]) {
      domains[name] = [];
    }

    domains[name].push(current_date);
    await chrome.storage.local.set({ domainVisits: domains });

    let current_day_visits = await getVisitsByDate(current_date);
    if (current_day_visits === null) {
      current_day_visits = [];
    }
    current_day_visits.push({
      name: url,
      start: start_time,
      end: end_time,
    });

    const result = await chrome.storage.local.get("visits");
    const visits = result.visits ?? {};

    if (!visits[current_date]) {
      visits[current_date] = [];
    }

    visits[current_date] = current_day_visits;

    await chrome.storage.local.set({ visits: visits });
  } catch (err) {
    console.warn("Error in addUrl:", err);
  }
};

/**
 * when a tab is switched, calculate previous website and add it
 */
chrome.tabs.onActivated.addListener(async (new_tab) => {
  const new_tab_id = new_tab.tabId;
  const time_now = Date.now();

  const prev_id = await getCurrentUrlId();
  const prev_start = await getCurrentUrlStartTime();

  await addUrl(prev_id, prev_start, time_now);

  await setCurrentUrlId(new_tab_id);
  await setCurrentUrlStartTime(time_now);
});

/**
 * when a new URL is visited within a tab
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const prev_id = await getCurrentUrlId();
  if (changeInfo.url && tabId === prev_id) {
    const time_now = Date.now();
    const prev_start = await getCurrentUrlStartTime();

    await addUrl(prev_id, prev_start, time_now);

    await setCurrentUrlId(tabId);
    await setCurrentUrlStartTime(time_now);
  }
});

/**
 * when a window is switched
 */
chrome.windows.onFocusChanged.addListener(async (window_id) => {
  const time_now = Date.now();

  if (window_id === chrome.windows.WINDOW_ID_NONE) {
    const prev_id = await getCurrentUrlId();
    const prev_start = await getCurrentUrlStartTime();

    await addUrl(prev_id, prev_start, time_now);

    await setCurrentUrlId(null);
    await setCurrentUrlStartTime(null);
  } else {
    try {
      const tabs = await queryActiveTab(window_id);
      if (tabs[0]) {
        await setCurrentUrlId(tabs[0].id);
        await setCurrentUrlStartTime(time_now);
      }
    } catch (err) {
      console.warn("Failed to query active tab:", err);
    }
  }
});

chrome.runtime.onInstalled.addListener(async (details) => {
  const domainVisits = await getDomains();
  if (domainVisits === null) {
    await chrome.storage.local.set({
      domainVisits: {},
    });
  }

  const visits = await getAllVisits();
  if (visits === null) {
    await chrome.storage.local.set({
      visits: {},
    });
  }

  const settings = await getSettings();
  if (settings === null) {
    await chrome.storage.local.set({
      settings: DEFAULT_SETTINGS,
    });
  }
});
