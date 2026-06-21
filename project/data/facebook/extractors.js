(() => {
  function clean(s) {
    return (s || "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
  }

  function splitVisibleTextLines(text) {
    return (text || "")
      .replace(/\r/g, "\n")
      .split("\n")
      .map(s => clean(s))
      .filter(Boolean);
  }

  function fixBrokenText(text) {
    return (text || "")
      .replace(/\r/g, "")
      .replace(/[ \t\u00A0]+/g, " ")
      .replace(/(?:\b[a-zA-Z]\s+){2,}[a-zA-Z]\b/g, m => m.replace(/\s+/g, ""))
      .replace(/(?:^|\n)(Facebook\s*)+(?=\n|$)/gi, "\n")
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  function decodeFacebookCommentToken(value) {
    if (!value) return null;
    try {
      const decoded = atob(decodeURIComponent(value));
      const m = decoded.match(/^comment:(.+)$/i);
      return m ? m[1] : value;
    } catch (e) {
      return value;
    }
  }

  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return r.width > 20 && r.height > 10 && st.display !== "none" && st.visibility !== "hidden";
  }

  function isVisibleBig(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return r.width > 50 && r.height > 50 && st.display !== "none" && st.visibility !== "hidden";
  }

  function isVisibleSmall(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return r.width > 3 && r.height > 3 && st.display !== "none" && st.visibility !== "hidden";
  }

  function area(el) {
    const r = el.getBoundingClientRect();
    return r.width * r.height;
  }

  function getMainContainer() {
    const dialogs = [...document.querySelectorAll("div[role='dialog']")].filter(isVisibleBig);
    if (dialogs.length) {
      dialogs.sort((a, b) => area(b) - area(a));
      return { el: dialogs[0], mode: "dialog" };
    }

    const main = document.querySelector('[role="main"]');
    if (main && isVisibleBig(main)) {
      return { el: main, mode: "main" };
    }

    const articles = [...document.querySelectorAll("div[role='article'], article")].filter(isVisibleBig);
    if (articles.length) {
      articles.sort((a, b) => area(b) - area(a));
      return { el: articles[0], mode: "article" };
    }

    return null;
  }

  function parseCounts(text) {
    const out = { comments: 0, shares: 0 };

    let m = text.match(/(\d+)\s+comments?/i) || text.match(/(\d+)\s+commentaires?/i);
    if (m) out.comments = Number(m[1]);

    m = text.match(/(\d+)\s+shares?/i) || text.match(/(\d+)\s+partages?/i);
    if (m) out.shares = Number(m[1]);

    return out;
  }

  function isBadgeText(text) {
    const t = clean(text).toLowerCase();
    return (
      t === "top fan" ||
      t === "super fan" ||
      t === "fan" ||
      t === "author" ||
      t === "auteur" ||
      t === "admin" ||
      t === "moderator" ||
      t === "top commenter" ||
      t === "commenter" ||
      t === "superfan" ||
      t.includes("top fan") ||
      t.includes("super fan")
    );
  }

  function isUiNoiseText(text) {
    const low = clean(text).toLowerCase();
    return (
      !low ||
      low === "like" ||
      low === "reply" ||
      low === "comment" ||
      low === "share" ||
      low === "j’aime" ||
      low === "jaime" ||
      low === "répondre" ||
      low === "repondre" ||
      low === "author" ||
      low === "auteur" ||
      low === "top fan" ||
      low === "super fan" ||
      low === "most relevant" ||
      low === "plus pertinents" ||
      low === "all comments" ||
      low === "tous les commentaires" ||
      low.includes("see translation") ||
      low.includes("voir la traduction") ||
      low.includes("all reactions") ||
      low.includes("filtered out") ||
      low.includes("write a comment") ||
      low.includes("écrire un commentaire") ||
      (low.includes("view all") && low.includes("repl")) ||
      (low.includes("view more") && low.includes("comment")) ||
      (low.includes("voir plus") && low.includes("comment")) ||
      (low.includes("voir les") && low.includes("réponses")) ||
      /^\d+\s+shares?$/i.test(low) ||
      /^\d+\s+partages?$/i.test(low) ||
      /^\d+\s+comments?$/i.test(low) ||
      /^\d+\s+commentaires?$/i.test(low)
    );
  }

  function isDateText(text) {
    const t = clean(text);
    if (!t) return false;
    return (
      /^just now$/i.test(t) ||
      /^now$/i.test(t) ||
      /^à l['']instant$/i.test(t) ||
      /^yesterday at/i.test(t) ||
      /^today at/i.test(t) ||
      /^hier à/i.test(t) ||
      /^aujourd['']hui à/i.test(t) ||
      /^a\s+week\s+ago$/i.test(t) ||
      /^an?\s+hour\s+ago$/i.test(t) ||
      /^an?\s+minute\s+ago$/i.test(t) ||
      /^\d+\s+seconds?\s+ago$/i.test(t) ||
      /^\d+\s+minutes?\s+ago$/i.test(t) ||
      /^\d+\s+hours?\s+ago$/i.test(t) ||
      /^\d+\s+days?\s+ago$/i.test(t) ||
      /^\d+\s+weeks?\s+ago$/i.test(t) ||
      /^\d+\s+months?\s+ago$/i.test(t) ||
      /^\d+\s+years?\s+ago$/i.test(t) ||
      /^il\s+y\s+a\s+\d+\s+jours?$/i.test(t) ||
      /^il\s+y\s+a\s+\d+\s+semaines?$/i.test(t) ||
      /^il\s+y\s+a\s+\d+\s+heures?$/i.test(t) ||
      /^il\s+y\s+a\s+\d+\s+minutes?$/i.test(t)||
      // Relatifs courts Facebook : "2h", "15w", "3d"
      /^\d+\s*(s|m|min|h|hr|hrs|d|j|w|y)$/i.test(t) ||
      /^\d+\s*sem\.?$/i.test(t) ||
      /^\d+\s*(secondes?|minutes?|heures?|jours?|days?|semaines?|weeks?|années?|years?)$/i.test(t) ||
      // Absolu anglais : "April 10" / "April 10, 2026 at 2:30 PM"
      /^[A-Za-z]+\s+\d{1,2}(?:,\s*\d{4})?(?:\s+at\s+\d{1,2}:\d{2}\s*[AP]M)?$/i.test(t) ||
      /^[A-Za-z]+\s+\d{1,2},\s*\d{4}\s+at\s+\d{1,2}:\d{2}\s*[AP]M$/i.test(t) ||
      // Français : "10 avril 2026" / "10 avril"
      /^\d{1,2}\s+[A-Za-zÀ-ÿ]+\s+\d{4}(?:\s+à\s+\d{1,2}:\d{2})?$/i.test(t) ||
      /^\d{1,2}\s+[A-Za-zÀ-ÿ]+$/i.test(t)
    );
  }

  function looksLikePersonName(text) {
    const t = clean(text);
    if (!t) return false;
    if (t.length > 80) return false;
    if (/\d/.test(t)) return false;
    if (/[#@:]/.test(t)) return false;
    if (isBadgeText(t)) return false;
    if (isUiNoiseText(t)) return false;
    if (isDateText(t)) return false;
    if (/j’aime|répondre|like|reply/i.test(t)) return false;
    if (/comments?|shares?|translation/i.test(t)) return false;
    return /^[A-Za-zÀ-ÿ\u0600-\u06FF'’ .-]{2,}$/.test(t);
  }

  function isReactionOnly(text) {
    const t = clean(text);
    if (!t) return false;
    return /^[\p{Emoji}\d\s.,!?:;()]+$/u.test(t);
  }

  function isActionText(text) {
    const low = clean(text).toLowerCase();
    return (
      low === "j’aime" ||
      low === "jaime" ||
      low === "répondre" ||
      low === "repondre" ||
      low === "like" ||
      low === "reply" ||
      /^\d+$/.test(low)
    );
  }

  function extractAuthor(lines) {
    for (const line of lines.slice(0, 30)) {
      const t = clean(line);
      const low = t.toLowerCase();

      if (!t) continue;
      if (low === "facebook") continue;
      if (low.includes("'s post")) continue;
      if (low.includes("publication de")) continue;
      if (low.includes("online status indicator")) continue;
      if (low === "active" || low === "actif") continue;
      if (low.includes("most relevant")) continue;
      if (isBadgeText(t)) continue;
      if (/comments?|shares?|like|reply/i.test(t)) continue;
      if (t.includes("·")) continue;
      if (t.length > 80) continue;

      return t;
    }
    return null;
  }

  function extractDate(lines) {
    for (const line of lines.slice(0, 40)) {
      const t = clean(line);
      const low = t.toLowerCase();

      if (!t) continue;
      if (low.includes("facebook")) continue;
      if (low === "active" || low === "actif") continue;
      if (isDateText(t)) return t;
    }
    return "";
  }

  function extractCaptionFromDom(root) {
  const rootRect = root.getBoundingClientRect();

  // trouver la première zone qui ressemble à un commentaire
  let firstCommentTop = Infinity;

  const commentCandidates = Array.from(
    root.querySelectorAll("div[aria-label], div[role='article'], li, article")
  ).filter(isVisible);

  for (const el of commentCandidates) {
    const lines = splitVisibleTextLines(el.innerText || el.textContent || "");
    if (!lines.length) continue;

    const hasName = lines.some(line => looksLikePersonName(line));
    const hasDate = lines.some(line => isDateText(line));

    if (hasName && hasDate) {
      const r = el.getBoundingClientRect();
      if (r.top >= rootRect.top && r.top < firstCommentTop) {
        firstCommentTop = r.top;
      }
    }
  }

  const candidates = Array.from(
    root.querySelectorAll("div[dir='auto'], span[dir='auto']")
  ).filter(isVisible);

  let best = "";

  for (const el of candidates) {
    const r = el.getBoundingClientRect();
    const text = clean(el.innerText || el.textContent || "");
    if (!text) continue;

    const low = text.toLowerCase();

    // ignorer ce qui est dans la zone des commentaires ou après
    if (r.top >= firstCommentTop) continue;

    // ignorer UI / bruit
    if (isUiNoiseText(text)) continue;
    if (isDateText(text)) continue;
    if (isBadgeText(text)) continue;
    if (isActionText(text)) continue;

    // ignorer header page
    if (low.includes("publication de")) continue;
    if (low === "mae assurances") continue;
    if (low.includes("mae assurances") && text.length < 50) continue;

    // ignorer lignes trop courtes
    if (text.length < 15) continue;

    // ignorer blocs qui ressemblent à un commentaire
    const lines = splitVisibleTextLines(text);
    const hasName = lines.some(line => looksLikePersonName(line));
    const hasDate = lines.some(line => isDateText(line));
    if (hasName && hasDate) continue;

    if (text.length > best.length) {
      best = text;
    }
  }

  return best;
}
  function extractPostDateFromDom(root) {
    const rootRect = root.getBoundingClientRect();

    // 1) trouver la première vraie zone commentaire
    let firstCommentTop = Infinity;

    const commentCandidates = Array.from(
      root.querySelectorAll("div[aria-label], div[role='article'], li, article")
    ).filter(isVisible);

    for (const el of commentCandidates) {
      const lines = splitVisibleTextLines(el.innerText || el.textContent || "");
      if (!lines.length) continue;

      const hasName = lines.some(line => looksLikePersonName(line));
      const hasDate = lines.some(line => isDateText(line));

      if (hasName && hasDate) {
        const r = el.getBoundingClientRect();
        if (r.top >= rootRect.top && r.top < firstCommentTop) {
          firstCommentTop = r.top;
        }
      }
    }

    // 2) ne chercher la date que dans le header haut du post
    const candidates = Array.from(
      root.querySelectorAll("a[aria-label], a[title], a[href], span[aria-label], span[title]")
    ).filter(isVisibleSmall);

    const good = [];

    for (const el of candidates) {
      const r = el.getBoundingClientRect();
      const txt = clean(
        el.getAttribute("aria-label") ||
        el.getAttribute("title") ||
        el.innerText ||
        ""
      );

      if (!txt) continue;

      // ignorer zone commentaires
      if (r.top >= firstCommentTop) continue;

      // ignorer éléments trop bas
      if (r.top > rootRect.top + 260) continue;

      // ignorer compteurs
      if (/^\d+\s+comments?$/i.test(txt)) continue;
      if (/^\d+\s+commentaires?$/i.test(txt)) continue;
      if (/^\d+\s+shares?$/i.test(txt)) continue;
      if (/^\d+\s+partages?$/i.test(txt)) continue;

      if (isDateText(txt)) {
        good.push({
          txt,
          top: r.top,
          left: r.left
        });
      }
    }

    if (!good.length) return "";

    // prendre la date la plus haute, la plus proche du header
    good.sort((a, b) => {
      if (a.top !== b.top) return a.top - b.top;
      return a.left - b.left;
    });

    return good[0].txt;
  }

  function getPostIdFromUrl() {
    const u = new URL(location.href);
    const story = u.searchParams.get("story_fbid") || "";
    const pid = u.searchParams.get("id") || "";
    return story && pid ? `${pid}:${story}` : location.href;
  }

  function buildCanonicalCommentUrl(el) {
    const allLinks = Array.from(el.querySelectorAll("a[href]"));

    for (const link of allLinks) {
      try {
        let href = (link.getAttribute("href") || "").replace(/&amp;/g, "&");
        if (!href) continue;

        if (href.startsWith("/")) {
          href = "https://www.facebook.com" + href;
        }

        const src = new URL(href, location.origin);
        const current = new URL(location.href);

        let commentId = src.searchParams.get("comment_id");
        let replyCommentId = src.searchParams.get("reply_comment_id");

        if (!commentId && !replyCommentId) continue;

        commentId = decodeFacebookCommentToken(commentId);
        replyCommentId = decodeFacebookCommentToken(replyCommentId);

        const out = new URL(current.origin + current.pathname + current.search);
        if (commentId) out.searchParams.set("comment_id", commentId);
        if (replyCommentId) out.searchParams.set("reply_comment_id", replyCommentId);

        return out.toString();
      } catch (e) {}
    }

    return null;
  }

  function extractCommentPieces(el) {
    const nodes = Array.from(
      el.querySelectorAll("div[dir='auto'], span[dir='auto'], strong, a, span, abbr")
    ).filter(isVisible);

    const rawLines = [];

    const selfAria = clean(el.getAttribute?.("aria-label") || "");
    const selfTitle = clean(el.getAttribute?.("title") || "");

    if (selfAria) rawLines.push(selfAria);
    if (selfTitle) rawLines.push(selfTitle);

    for (const n of nodes) {
      const lines = splitVisibleTextLines(n.innerText || n.textContent || "");
      for (const line of lines) rawLines.push(line);

      const aria = clean(n.getAttribute?.("aria-label") || "");
      const title = clean(n.getAttribute?.("title") || "");

      if (aria) rawLines.push(aria);
      if (title) rawLines.push(title);
    }

    const parts = [...new Set(rawLines.map(clean).filter(Boolean))];

    let author = null;
    for (const p of parts) {
      if (looksLikePersonName(p)) {
        author = clean(p);
        break;
      }
    }

    let commentDate = null;

    // priorité 1 : aria-label / title complets
    for (const n of nodes) {
      const aria = clean(n.getAttribute?.("aria-label") || "");
      const title = clean(n.getAttribute?.("title") || "");
      const txt = clean(n.innerText || n.textContent || "");

      if (aria && isDateText(aria)) {
        commentDate = aria;
        break;
      }
      if (title && isDateText(title)) {
        commentDate = title;
        break;
      }
      if (txt && isDateText(txt)) {
        commentDate = txt;
        break;
      }
    }

    // priorité 2 : chercher dans tout le bloc commentaire
    if (!commentDate) {
      const allDateLike = Array.from(el.querySelectorAll("*"))
        .filter(isVisibleSmall)
        .map(n => clean(
          n.getAttribute?.("aria-label") ||
          n.getAttribute?.("title") ||
          n.innerText ||
          n.textContent ||
          ""
        ))
        .filter(Boolean)
        .filter(t => isDateText(t));

      if (allDateLike.length) {
        commentDate = allDateLike[0];
      }
    }

    const textParts = [];

    for (const p of parts) {
      let t = clean(p);
      if (!t) continue;

      if (author && t.toLowerCase() === author.toLowerCase()) continue;
      if (isBadgeText(t)) continue;
      if (isUiNoiseText(t)) continue;
      if (isDateText(t)) continue;
      if (isActionText(t)) continue;
      if (isReactionOnly(t)) continue;

      // nettoyage des préfixes Facebook
      t = t.replace(/^comment by\s+.+?\s+(a week ago|an hour ago|an minute ago|\d+\s+\w+\s+ago)\s*/i, "");
      t = t.replace(/^reply by\s+.+?\s+to\s+.+?\s+(a week ago|an hour ago|an minute ago|\d+\s+\w+\s+ago)\s*/i, "");
      t = clean(t);

      if (!t) continue;

      textParts.push(t);
    }

    const text = textParts.join(" ").replace(/\s+/g, " ").trim();

    return {
      author,
      text,
      comment_date: commentDate,
    };
  }

  function extractCommentsFromDom(root, caption) {
    const nodes = [];
    const seenRaw = new Set();

    const candidates = Array.from(
      root.querySelectorAll("div[aria-label], div[role='article'], li, article")
    ).filter(isVisible);

    for (const el of candidates) {
      const rawFullText = el.innerText || el.textContent || "";
      const fullLines = splitVisibleTextLines(rawFullText);
      const fullText = fullLines.join(" ").trim();

      if (!fullText) continue;
      if (caption && fullText === caption) continue;

      const rect = el.getBoundingClientRect();
      const pieces = extractCommentPieces(el);

      let author = pieces.author;
      let text = pieces.text;
      const commentDate = pieces.comment_date;

      if (!author) continue;

      if (!text) {
        const fallback = fullLines.filter(line => {
          if (!line) return false;
          if (author && line.toLowerCase() === author.toLowerCase()) return false;
          if (isBadgeText(line)) return false;
          if (isUiNoiseText(line)) return false;
          if (isDateText(line)) return false;
          if (isActionText(line)) return false;
          if (isReactionOnly(line)) return false;
          return true;
        });

        text = fallback.join(" ").trim();
      }

      if (!text) continue;
      if (caption && caption.includes(text)) continue;

      // ignorer les faux textes techniques Facebook
      const lowText = text.toLowerCase();
      if (lowText.startsWith("comment by ")) continue;
      if (lowText.startsWith("reply by ")) continue;
      if (lowText.includes("see translation")) continue;
      if (lowText.includes("voir la traduction")) continue;

      const rawKey = `${author}|||${text}|||${Math.round(rect.left)}|||${Math.round(rect.top)}`;
      if (seenRaw.has(rawKey)) continue;
      seenRaw.add(rawKey);

      nodes.push({
        author,
        text,
        url: buildCanonicalCommentUrl(el),
        comment_date: commentDate,
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        replies: [],
      });
    }

    nodes.sort((a, b) => {
      if (a.top !== b.top) return a.top - b.top;
      return a.left - b.left;
    });

    if (!nodes.length) return [];

    const minLeft = Math.min(...nodes.map(n => n.left));
    const replyThreshold = 25;

    const out = [];
    let lastTopLevel = null;
    const seenFinal = new Set();

    for (const node of nodes) {
      const finalKey = `${node.author}|||${node.text}`;
      if (seenFinal.has(finalKey)) continue;
      seenFinal.add(finalKey);

      const isReply = (node.left - minLeft) >= replyThreshold;

      const item = {
        author: node.author,
        text: node.text,
        url: node.url,
        comment_date: node.comment_date,
        replies: []
      };

      if (isReply && lastTopLevel) {
        lastTopLevel.replies.push(item);
      } else {
        out.push(item);
        lastTopLevel = item;
      }
    }

    return out;
  }

  const containerInfo = getMainContainer();
  if (!containerInfo) {
    return {
      url: location.href,
      post_id: getPostIdFromUrl(),
      author: null,
      caption: "",
      date_text: "",
      comments_count_displayed: 0,
      shares_count_displayed: 0,
      comments: [],
      mode: "none"
    };
  }

  const root = containerInfo.el;
  const rawText = fixBrokenText(root.innerText || "");
  const lines = rawText.split("\n").map(clean).filter(Boolean);
  const counts = parseCounts(rawText);
  const author = extractAuthor(lines);
  const dateText = extractPostDateFromDom(root) || extractDate(lines);
  const caption = extractCaptionFromDom(root);
  const comments = extractCommentsFromDom(root, caption);

  return {
    url: location.href,
    post_id: getPostIdFromUrl(),
    author,
    caption,
    date_text: dateText,
    comments_count_displayed: counts.comments,
    shares_count_displayed: counts.shares,
    comments,
    mode: containerInfo.mode,
  };
})();