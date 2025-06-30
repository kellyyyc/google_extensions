const settings = null;
const visits = null;
document.addEventListener('DOMContentLoaded', async () => {
    await chrome.storage.sync.get().then((result) => {
        settings = result.settings;
    });

    await chrome.storage.local.get().then((result) => {
        visits = result.visits;
        load(visits);
    });
});

const load = (data) => {
    const wrapper = document.getElementById("info-wrapper");
    
    const all_visits = document.createElement("div");
    for (const visit_date in data) {
        const website_visits = data[visit_date];
        if (!website_visits) {
            continue;
        }
        
        const single_date_element = document.createElement("div");

        const date_element = document.createElement("div");
        date_element.className = "date";
        date_element.textContent = `${visit_date}`;
        single_date_element.appendChild(date_element);

        const entries_container_element = document.createElement("div");
        entries_container_element.className = "entries-container";
        let prev_visit = null;
        for (const visit in website_visits) {
            const name = website_visits[visit].name;
            const start_epoch = website_visits[visit].start;
            const end_epoch = website_visits[visit].end;
            if (!name || !start_epoch || !end_epoch) {
                continue;
            }

            try {
                const start_time = new Date(start_epoch).toLocaleTimeString();
                const end_time = new Date(end_epoch).toLocaleTimeString();
                // add expanded eurl option
                // if 
                const entry_info_element = document.createElement("div");
                entry_info_element.textContent = `${name}: ${start_time}-${end_time}`;
                entries_container_element.appendChild(entry_info_element);
            } catch (err) {
                console.warn("Error: ", err);
            }

            prev_visit = visit;
        }

        single_date_element.appendChild(entries_container_element);
        all_visits.appendChild(single_date_element);
    }

    wrapper.appendChild(all_visits);
};

document.getElementById("settings-icon").addEventListener("click", () => {
    document.getElementById("settings-page").style.display = "block";
    document.getElementById("main-page").style.display = "none";
});

document.getElementById("settings-save").addEventListener("click", async () => {
    const settings = [];
    const settings_container = document.getElementById("settings-container").children;
    for (let setting of settings_container) {
        if (setting.tagName === "INPUT") {
            // change - to _
            const setting_name = setting.id;
            const setting_value = setting.value;
            settings.push({ [setting_name]: setting_value });
        }
    };

    await chrome.storage.sync.set({ "settings": settings });

    document.getElementById("settings-page").style.display = "none";
    document.getElementById("main-page").style.display = "block";
});

document.getElementById("settings-cancel").addEventListener("click", () => {
    document.getElementById("settings-page").style.display = "none";
    document.getElementById("main-page").style.display = "block";
});