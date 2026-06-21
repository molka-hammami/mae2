() => {
    function clean(s) {
        return (s || "").replace(/\s+/g, " ").trim();
    }

    function isVisible(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        return r.width > 40 && r.height > 40 &&
               st.display !== "none" &&
               st.visibility !== "hidden";
    }

    function normalizeHref(h) {
        return (h || "").replace(/&amp;/g, "&");
    }

    function extractVisibleDateText(el) {
        const candidates = [...el.querySelectorAll("a[aria-label], a[title], span, div")]
            .map(n => ({
                text: clean(n.innerText || ""),
                aria: clean(n.getAttribute?.("aria-label") || ""),
                title: clean(n.getAttribute?.("title") || "")
            }));

        for (const c of candidates) {
            const s = c.aria || c.title || c.text;
            if (!s) continue;

            if (
                /^\d+\s*(s|m|min|h|hr|hrs|d|j|w|y)$/i.test(s) ||
                /^just now$/i.test(s) ||
                /^now$/i.test(s) ||
                /^à l['’]instant$/i.test(s) ||
                /^today/i.test(s) ||
                /^yesterday/i.test(s) ||
                /^aujourd/i.test(s) ||
                /^hier/i.test(s) ||
                /^[A-Za-z]+\s+\d{1,2}/i.test(s) ||
                /^\d{1,2}\s+[A-Za-zÀ-ÿ]+/i.test(s)
            ) {
                return s;
            }
        }

        return "";
    }

    function extractBestHref(hrefs) {
        for (const h of hrefs) {
            const low = h.toLowerCase();

            if (low.includes("/reel/")) continue;
            if (low.includes("login")) continue;
            if (low.includes("signup")) continue;

            if (
                low.includes("permalink.php") ||
                low.includes("/posts/") ||
                (low.includes("story.php") && low.includes("story_fbid=")) ||
                low.includes("fbid=")
                ) {
                return h;
                }
        }
        return null;
    }

    const articles = [...document.querySelectorAll("div[role='article'], article")]
        .filter(isVisible);

    return articles.map((el, idx) => {
        const rect = el.getBoundingClientRect();
        const html = el.innerHTML || "";
        const txt = clean(el.innerText || "");

        const hrefs = [...el.querySelectorAll("a[href]")]
            .map(a => normalizeHref(a.getAttribute("href") || ""))
            .filter(Boolean);

        let storyFbid = null;
        for (const pat of [
            /"story_fbid":"(pfbid[^"]+)"/,
            /[?&]story_fbid=(pfbid[^&"']+)/,
            /[?&]story_fbid=([0-9]{8,})/
        ]) {
            const m = html.match(pat);
            if (m) {
                storyFbid = m[1];
                break;
            }
        }

        return {
            idx,
            top: rect.top + window.scrollY,
            storyFbid,
            hrefUrl: extractBestHref(hrefs),
            hrefs: hrefs,
            is_pinned: /pinned post|publication épinglée/i.test(txt),
            dateText: extractVisibleDateText(el),
            text: txt.slice(0, 300)
        };
    });
}