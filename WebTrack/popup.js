chrome.storage.local.get().then((result) => {
    const urls_data = result.urls_data;
    const wrapper = document.getElementById("info-wrapper");
    
    const new_item = document.createElement("div");
    
    for (const url in urls_data) {
        const url_times = urls_data[url];
        if (!url_times) {
            continue;
        }

        const url_element = document.createElement("div");
        url_element.innerText = `${url}`;

        const times_wrapper = document.createElement("div");
        for (const idx in url_times) {
            const start_epoch = url_times[idx].start;
            const end_epoch = url_times[idx].end;
            console.log(url_times[idx]);
            console.log(start_epoch);
            console.log(end_epoch);

            if (!start_epoch || !end_epoch) {
                continue;
            }

            try {
                const start_time = new Date(start_epoch);
                const end_time = new Date(end_epoch);
                const time_element = document.createElement("div");
                time_element.innerText = `${JSON.stringify(start_time)} ${JSON.stringify(end_time)}`;
                times_wrapper.appendChild(time_element);
            } catch (err) {
                console.warn("Invalid start/end time for: ", url, err);
            }
        }

        url_element.appendChild(times_wrapper);
        new_item.appendChild(url_element);
    }

    wrapper.appendChild(new_item);
});