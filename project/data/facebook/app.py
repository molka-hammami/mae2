from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from playwright.async_api import Page, async_playwright
from models import Comment, PostData

SESSION_DIR = Path("session")
OUTPUT_FILE = "try_async.json"
PAGE_ID = "100080057751170"
PAGE_URL = f"https://www.facebook.com/profile.php?id={PAGE_ID}&locale=fr_FR"

# Mets ici le nombre de posts récents que tu veux
MAX_POSTS = 20
SCROLL_STEPS = 200


def count_comments_tree(comments: list[dict]) -> int:
    total = 0
    for c in comments or []:
        total += 1
        total += count_comments_tree(c.get("replies", []))
    return total


async def get_displayed_comment_count(page: Page) -> int:
    try:
        return await page.evaluate("""
        () => {
            const roots = [...document.querySelectorAll("div[role='dialog'], [role='main']")]
              .filter(el => {
                const r = el.getBoundingClientRect();
                const st = getComputedStyle(el);
                return r.width > 200 && r.height > 200 && st.display !== "none" && st.visibility !== "hidden";
              });

            const root = roots.sort((a, b) =>
              (b.getBoundingClientRect().width * b.getBoundingClientRect().height) -
              (a.getBoundingClientRect().width * a.getBoundingClientRect().height)
            )[0] || document.body;

            const txt = (root.innerText || "").replace(/\\s+/g, " ");
            const m = txt.match(/(\\d+)\\s+comments?/i) || txt.match(/(\\d+)\\s+commentaires?/i);
            return m ? parseInt(m[1], 10) : 0;
        }
        """)
    except Exception:
        return 0


async def scroll_all_comment_areas(page: Page):
    try:
        await page.evaluate("""
        () => {
            const els = [...document.querySelectorAll("div, section, main")].filter(el => {
                const st = getComputedStyle(el);
                const r = el.getBoundingClientRect();
                const scrollable = (el.scrollHeight - el.clientHeight) > 80;
                return (
                    scrollable &&
                    r.width > 200 &&
                    r.height > 120 &&
                    st.display !== "none" &&
                    st.visibility !== "hidden"
                );
            });

            for (const el of els) {
                el.scrollTop = el.scrollHeight;
            }

            window.scrollTo(0, document.body.scrollHeight);
        }
        """)
    except Exception:
        pass


async def click_comment_controls_round(page: Page) -> int:
    async def click_all_text(label: str, max_clicks: int = 40) -> int:
        clicked = 0
        try:
            loc = page.get_by_text(label, exact=False)
            count = await loc.count()
            for i in range(min(count, max_clicks)):
                try:
                    await loc.nth(i).scroll_into_view_if_needed(timeout=800)
                    await loc.nth(i).click(timeout=800)
                    await page.wait_for_timeout(300)
                    clicked += 1
                except Exception:
                    pass
        except Exception:
            pass
        return clicked

    clicked = 0

    for label in [
        "Most relevant", "Plus pertinents",
        "All comments", "Tous les commentaires",
    ]:
        clicked += await click_all_text(label, max_clicks=8)

    for label in [
        "All comments", "Tous les commentaires",
        "View more comments", "More comments",
        "Voir plus de commentaires", "Plus de commentaires",
        "View more replies", "View replies", "View all replies",
        "Voir les réponses", "Voir plus de réponses",
        "Afficher les réponses", "Afficher plus de réponses",
    ]:
        clicked += await click_all_text(label, max_clicks=40)

    for _ in range(3):
        await scroll_all_comment_areas(page)
        try:
            await page.mouse.wheel(0, 3000)
        except Exception:
            pass
        await page.wait_for_timeout(700)

    return clicked


def clean_permalink(url: str) -> str:
    if not url:
        return ""

    if url.startswith("/"):
        url = "https://www.facebook.com" + url

    p = urlparse(url)
    qs = parse_qs(p.query)

    if "story_fbid" in qs and "id" in qs:
        story_fbid = qs["story_fbid"][0]
        pid = qs["id"][0]
        clean_q = urlencode({"story_fbid": story_fbid, "id": pid})
        return urlunparse(("https", "www.facebook.com", "/permalink.php", "", clean_q, ""))

    if "story_fbid" in qs and "id" not in qs:
        story_fbid = qs["story_fbid"][0]
        clean_q = urlencode({"story_fbid": story_fbid, "id": PAGE_ID})
        return urlunparse(("https", "www.facebook.com", "/permalink.php", "", clean_q, ""))

    if "/posts/" in p.path:
        return url.split("?")[0].split("#")[0] + f"?id={PAGE_ID}"

    return url.split("#")[0]


def parse_date_text(date_text: str, reference_dt: Optional[datetime] = None) -> Optional[str]:
    if not date_text:
        return None

    reference_dt = reference_dt or datetime.now()
    text = date_text.strip()
    low = text.lower()

    if low == "just now" or low == "à l’instant" or low == "a l’instant":
        return reference_dt.strftime("%d/%m/%Y")
    
    if re.match(r"^a\s+week\s+ago$", low):
        return (reference_dt - timedelta(weeks=1)).strftime("%d/%m/%Y")

    if re.match(r"^an?\s+hour\s+ago$", low):
        return (reference_dt - timedelta(hours=1)).strftime("%d/%m/%Y")

    if re.match(r"^an?\s+minute\s+ago$", low):
        return (reference_dt - timedelta(minutes=1)).strftime("%d/%m/%Y")

    m_ago = re.match(r"^(\d+)\s+(second|seconds|minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\s+ago$", low)
    if m_ago:
        value = int(m_ago.group(1))
        unit = m_ago.group(2)

        if unit.startswith("second"):
            dt = reference_dt - timedelta(seconds=value)
        elif unit.startswith("minute"):
            dt = reference_dt - timedelta(minutes=value)
        elif unit.startswith("hour"):
            dt = reference_dt - timedelta(hours=value)
        elif unit.startswith("day"):
            dt = reference_dt - timedelta(days=value)
        elif unit.startswith("week"):
            dt = reference_dt - timedelta(weeks=value)
        elif unit.startswith("month"):
            dt = reference_dt - timedelta(days=30 * value)
        else:
            dt = reference_dt - timedelta(days=365 * value)

        return dt.strftime("%d/%m/%Y")

    m_fr = re.match(r"^il\s+y\s+a\s+(\d+)\s+(minute|minutes|heure|heures|jour|jours|semaine|semaines)$", low)
    if m_fr:
        value = int(m_fr.group(1))
        unit = m_fr.group(2)

        if unit.startswith("minute"):
            dt = reference_dt - timedelta(minutes=value)
        elif unit.startswith("heure"):
            dt = reference_dt - timedelta(hours=value)
        elif unit.startswith("jour"):
            dt = reference_dt - timedelta(days=value)
        else:
            dt = reference_dt - timedelta(weeks=value)

        return dt.strftime("%d/%m/%Y")

    if re.match(r"^\d+\s+comments?$", text, re.I):
        return None
    if re.match(r"^\d+\s+commentaires?$", text, re.I):
        return None
    if re.match(r"^\d+\s+shares?$", text, re.I):
        return None
    if re.match(r"^\d+\s+partages?$", text, re.I):
        return None

    if re.match(r"^yesterday at", text, re.I):
        return (reference_dt - timedelta(days=1)).strftime("%d/%m/%Y")
    if re.match(r"^today at", text, re.I):
        return reference_dt.strftime("%d/%m/%Y")
    if re.match(r"^hier à", text, re.I):
        return (reference_dt - timedelta(days=1)).strftime("%d/%m/%Y")
    if re.match(r"^aujourd['’]hui à", text, re.I):
        return reference_dt.strftime("%d/%m/%Y")

    m = re.match(
        r"^(\d+)\s*(s|m|min|h|hr|hrs|d|j|w|y|sem|sem\.|semaine|semaines|secondes?|minutes?|heures?|jours?|days?|weeks?|années?|years?)$",
        text,
        re.I,
    )
    if m:
        value = int(m.group(1))
        unit = m.group(2).lower()

        if unit in {"s", "seconde", "secondes"}:
            dt = reference_dt - timedelta(seconds=value)
        elif unit in {"m", "min", "minute", "minutes"}:
            dt = reference_dt - timedelta(minutes=value)
        elif unit in {"h", "hr", "hrs", "heure", "heures"}:
            dt = reference_dt - timedelta(hours=value)
        elif unit in {"d", "j", "jour", "jours", "day", "days"}:
            dt = reference_dt - timedelta(days=value)
        elif unit in {"w", "sem", "sem.", "semaine", "semaines", "week", "weeks"}:
            dt = reference_dt - timedelta(weeks=value)
        elif unit in {"y", "année", "années", "year", "years"}:
            dt = reference_dt - timedelta(days=365 * value)
        else:
            return None

        return dt.strftime("%d/%m/%Y")

    for fmt in [
        "%B %d at %I:%M %p",
        "%B %d, %Y at %I:%M %p",
        "%B %d, %Y",
        "%B %d",
        "%d %B",
        "%d %B %Y",
        # Formats avec heure complète (aria-label Facebook)
        "%B %d, %Y at %I:%M %p",  # espace insécable avant AM/PM
    ]:
        try:
            # Normaliser l'espace insécable avant AM/PM
            text_norm = text.replace(" ", " ").replace(" ", " ")
            dt = datetime.strptime(text_norm, fmt)
            if "%Y" not in fmt:
                dt = dt.replace(year=reference_dt.year)
            return dt.strftime("%d/%m/%Y")
        except ValueError:
            pass

    fr_months = {
        "janvier": "January",
        "février": "February",
        "fevrier": "February",
        "mars": "March",
        "avril": "April",
        "mai": "May",
        "juin": "June",
        "juillet": "July",
        "août": "August",
        "aout": "August",
        "septembre": "September",
        "octobre": "October",
        "novembre": "November",
        "décembre": "December",
        "decembre": "December",
    }

    lowered = text.lower()
    for fr, en in fr_months.items():
        lowered = lowered.replace(fr, en)

    for fmt in [
        "%d %B",
        "%d %B %Y",
        "%d %B %Y à %H:%M",
    ]:
        try:
            dt = datetime.strptime(lowered, fmt)
            if "%Y" not in fmt:
                dt = dt.replace(year=reference_dt.year)
            return dt.strftime("%d/%m/%Y")
        except ValueError:
            pass

    return None


def extract_post_date_from_html(
    html: str,
    reference_dt: Optional[datetime] = None,
    min_allowed_dt: Optional[datetime] = None,
) -> Optional[str]:
    """
    Extrait la date de publication depuis le HTML d'un post.
    Cherche les timestamps près de story_fbid pour éviter de capturer
    des timestamps de commentaires ou de métadonnées sans rapport.
    """
    if not html:
        return None

    reference_dt = reference_dt or datetime.now()

    # Fenêtre valide : entre 7 ans en arrière et demain
    MIN_DT = datetime(reference_dt.year - 7, 1, 1)
    MAX_DT = reference_dt + timedelta(days=1)

    def is_valid(dt: datetime) -> bool:
        if dt > MAX_DT or dt < MIN_DT:
            return False
        if min_allowed_dt and dt > min_allowed_dt + timedelta(days=1):
            return False
        return True

    # Stratégie 1 : story_publish_time (le plus fiable)
    for m in re.finditer(r'"story_publish_time"\s*:\s*(\d{10})', html):
        try:
            dt = datetime.fromtimestamp(int(m.group(1)))
            if is_valid(dt):
                return dt.strftime("%d/%m/%Y")
        except Exception:
            pass

    # Stratégie 2 : creation_time PRÈS d'un story_fbid (fenêtre 1500 chars)
    candidates = []
    for fbid_m in re.finditer(r'"story_fbid"', html):
        pos = fbid_m.start()
        window = html[max(0, pos - 200): pos + 1500]
        for pat in [r'"creation_time"\s*:\s*(\d{10})',
                    r'"publish_time"\s*:\s*(\d{10})']:
            for tm in re.finditer(pat, window):
                try:
                    dt = datetime.fromtimestamp(int(tm.group(1)))
                    if is_valid(dt):
                        candidates.append(dt)
                except Exception:
                    pass

    if candidates:
        return min(candidates).strftime("%d/%m/%Y")

    # Stratégie 3 : fallback global tous patterns
    all_found = []
    for pat in [r'"creation_time"\s*:\s*(\d{10})',
                r'"publish_time"\s*:\s*(\d{10})',
                r'"scheduled_publish_time"\s*:\s*(\d{10})']:
        for m in re.finditer(pat, html):
            try:
                dt = datetime.fromtimestamp(int(m.group(1)))
                if is_valid(dt):
                    all_found.append(dt)
            except Exception:
                pass

    if all_found:
        return min(all_found).strftime("%d/%m/%Y")

    return None

def is_valid_post_url(url: str) -> bool:
    if not url:
        return False

    low = url.lower()
    return (
        "permalink.php" in low
        or "/posts/" in low
        or ("story.php" in low and "story_fbid=" in low)
        or "fbid=" in low
    )


async def collect_post_candidates(page: Page, collect_js: str = ""):
    found: dict[str, dict] = {}
    order = 0
    stable_rounds = 0
    prev_count = 0

    async def collect_visible_cards():
        nonlocal order

        cards = await page.evaluate(collect_js if collect_js else "(()=>[])()")

        # ordre visuel réel : du haut vers le bas
        cards.sort(key=lambda x: (x.get("top", 0), x.get("idx", 0)))

        print(f"[collect] visibles={len(cards)} | uniques={len(found)}")

        for card in cards:
            if card.get("is_pinned"):
                continue

            chosen = None

            if card.get("storyFbid"):
                chosen = f"https://www.facebook.com/permalink.php?story_fbid={card['storyFbid']}&id={PAGE_ID}"

            if not chosen and card.get("hrefUrl"):
                h = card["hrefUrl"]
                if not h.startswith("http"):
                    h = "https://www.facebook.com" + h
                chosen = h

            if not chosen and card.get("hrefs"):
                for h in card["hrefs"]:
                    low = h.lower()

                    if "/reel/" in low:
                        continue
                    if "login" in low or "signup" in low:
                        continue

                    if not h.startswith("http"):
                        h = "https://www.facebook.com" + h

                    if (
                        "permalink.php" in low
                        or "/posts/" in low
                        or ("story.php" in low and "story_fbid=" in low)
                        or "fbid=" in low
                    ):
                        chosen = h
                        break

            if not chosen:
                continue

            full = clean_permalink(chosen)
            if not full or not is_valid_post_url(full):
                continue

            if full not in found:
                found[full] = {
                    "href": full,
                    "top": card.get("top", 0),
                    "order": order,
                    "dateText": card.get("dateText"),
                    "text": card.get("text"),
                }
                order += 1

    await page.evaluate("window.scrollTo(0, 0)")
    await page.wait_for_timeout(2500)
    await collect_visible_cards()

    # on scrolle juste assez pour découvrir les posts récents suivants
    for step in range(SCROLL_STEPS):
        if stable_rounds >= 8:
            break

        await page.mouse.wheel(0, 1800)

        if step % 5 == 0:
            await page.wait_for_timeout(5000)
        else:
            await page.wait_for_timeout(3000)

        await collect_visible_cards()

        print(f"[collect] step={step} | uniques={len(found)}")

        if len(found) == prev_count:
            stable_rounds += 1
        else:
            stable_rounds = 0

        prev_count = len(found)

    if not found:
        print("[collect] Aucun post trouvé !")
        return []

    items = list(found.values())

    # très important : ne pas trier par timestamp
    # Facebook affiche déjà les plus récents en haut
    items.sort(key=lambda x: x["order"])

    print(f"\n[collect] {len(items)} posts candidats")
    print("[collect] Top candidats finaux :")
    for i, x in enumerate(items[:MAX_POSTS], start=1):
        print(f"  {i}. order={x['order']} | dateText={x.get('dateText')} | {x['href']}")

    return [x["href"] for x in items[:MAX_POSTS]]

def normalize_comment_dates(comments: list[dict], reference_dt: datetime) -> list[dict]:
    out = []
    for c in comments or []:
        item = dict(c)

        raw_date = (item.get("comment_date") or "").strip()
        parsed = parse_date_text(raw_date, reference_dt)
        item["comment_date"] = parsed if parsed else raw_date or None

        item["author"] = (item.get("author") or "").strip() or None
        item["text"] = (item.get("text") or "").strip()

        replies = item.get("replies", []) or []
        item["replies"] = normalize_comment_dates(replies, reference_dt)

        out.append(item)

    return out


def clean_comment_authors(comments: list[dict]) -> list[dict]:
    badges = {"super fan", "top fan", "fan", "author", "auteur"}

    out = []
    for c in comments or []:
        item = dict(c)

        author = (item.get("author") or "").strip()
        if author.lower() in badges:
            item["author"] = None

        item["replies"] = clean_comment_authors(item.get("replies", []) or [])
        out.append(item)

    return out


def filter_real_comments(comments: list[dict]) -> list[dict]:
    out = []

    for c in comments or []:
        item = dict(c)

        # garder même si texte vide si auteur + date existent
        has_author = bool(item.get("author"))
        has_text = bool((item.get("text") or "").strip())
        has_replies = bool(item.get("replies"))

        if has_author and (has_text or has_replies):
            item["replies"] = filter_real_comments(item.get("replies", []) or [])
            out.append(item)

    return out

async def switch_to_all_comments(page: Page):
    try:
        await page.get_by_text("Most relevant", exact=False).click(timeout=3000)
        await page.wait_for_timeout(800)
    except Exception:
        try:
            await page.get_by_text("Plus pertinents", exact=False).click(timeout=3000)
            await page.wait_for_timeout(800)
        except Exception:
            print("Bouton tri non trouvé")
            return

    try:
        await page.get_by_text("All comments", exact=False).click(timeout=3000)
        await page.wait_for_timeout(1500)
    except Exception:
        try:
            await page.get_by_text("Tous les commentaires", exact=False).click(timeout=3000)
            await page.wait_for_timeout(1500)
        except Exception:
            print("All comments non trouvé")


async def extract_one_post(context, url: str, extractor_js: str) -> Optional[PostData]:
    page = await context.new_page()
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(5000)

        await switch_to_all_comments(page)
        await page.wait_for_timeout(2000)

        target_count = await get_displayed_comment_count(page)
        print(f"   -> compteur Facebook : {target_count}")

        best_data = None
        best_count = 0
        previous_count = -1
        stable_rounds = 0
        max_rounds = 60

        for round_idx in range(max_rounds):
            clicked = await click_comment_controls_round(page)

            data = await page.evaluate(extractor_js)
            current_count = count_comments_tree(data.get("comments", [])) if data else 0
            displayed_now = await get_displayed_comment_count(page)

            if current_count > best_count:
                best_count = current_count
                best_data = data

            print(
                f"   -> round {round_idx + 1}: "
                f"extraits={current_count} cible_initiale={target_count} "
                f"cible_visible={displayed_now} clics={clicked}"
            )

            if target_count > 0 and current_count >= target_count:
                break

            if current_count == previous_count and clicked == 0:
                stable_rounds += 1
            elif current_count <= previous_count:
                stable_rounds += 1
            else:
                stable_rounds = 0

            previous_count = current_count

            if stable_rounds >= 8:
                break

        data = best_data if best_data else await page.evaluate(extractor_js)
        print("DEBUG mode:", data.get("mode"), "| comments_extraits:", len(data.get("comments", [])))

        if not data:
            return None

        reference_dt = datetime.now()

        normalized_comments = normalize_comment_dates(data.get("comments", []), reference_dt)
        normalized_comments = clean_comment_authors(normalized_comments)
        normalized_comments = filter_real_comments(normalized_comments)

        comments = [Comment(**c) for c in normalized_comments]

        html = await page.content()
        date_text = (data.get("date_text", "") or "").strip()

        if re.match(r"^\d+\s+comments?$", date_text, re.I):
            date_text = ""
        if re.match(r"^\d+\s+commentaires?$", date_text, re.I):
            date_text = ""
        if re.match(r"^\d+\s+shares?$", date_text, re.I):
            date_text = ""
        if re.match(r"^\d+\s+partages?$", date_text, re.I):
            date_text = ""

        date_post = parse_date_text(date_text, reference_dt)

        # fallback HTML seulement si vraiment aucun texte de date lisible
        if not date_post:
            date_post = extract_post_date_from_html(
                html,
                reference_dt=reference_dt,
                min_allowed_dt=None,
            )

        print("DEBUG date_text:", repr(date_text), "| date_post:", date_post)

        return PostData(
            url=data["url"],
            post_id=data["post_id"],
            author=data.get("author"),
            caption=data.get("caption", ""),
            date_post=date_post,
            comments_count_displayed=data.get("comments_count_displayed", 0),
            shares_count_displayed=data.get("shares_count_displayed", 0),
            comments_full=comments,
        )
    finally:
        await page.close()


async def click_posts_tab(page: Page) -> bool:
    print("[nav] Recherche de l'onglet Posts dans la nav de la page...")

    if "story_fbid" in page.url:
        await page.goto(PAGE_URL, wait_until="domcontentloaded", timeout=30000)

    await page.wait_for_selector("div[role='article']", timeout=15000)

    tab_labels = ["Posts", "Publications", "المنشورات", "المنشور"]

    for label in tab_labels:
        try:
            loc = page.locator(
                f"a[role='tab']:has-text('{label}'), div[role='tab']:has-text('{label}')"
            )
            if await loc.count() == 0:
                continue

            before_count = await page.locator("div[role='article']").count()

            await loc.first.scroll_into_view_if_needed(timeout=3000)
            await loc.first.click(timeout=4000)

            try:
                await page.wait_for_load_state("domcontentloaded", timeout=5000)
            except Exception:
                pass

            await page.wait_for_timeout(4000)
            await page.mouse.wheel(0, 1200)
            await page.wait_for_timeout(2500)

            after_count = await page.locator("div[role='article']").count()
            print(f"[nav] Onglet '{label}' cliqué  | articles: {before_count} -> {after_count} | url={page.url}")
            return True
        except Exception:
            pass

    print("[nav] Onglet Posts non trouvé")
    return False


async def collect_all_post_urls_mbasic(context) -> list:
    """
    Collecte les URLs de posts via mbasic.facebook.com avec pagination robuste.
    Sauvegarde le HTML des premières pages pour diagnostiquer la pagination.
    """
    print(f"[mbasic] Collecte de {MAX_POSTS} posts via mbasic.facebook.com...")
    page = await context.new_page()
    urls = []
    seen = set()

    def extract_fbids(html):
        results = []
        for m in re.finditer(r'story_fbid=(pfbid[A-Za-z0-9]+)', html):
            fbid = m.group(1)
            if fbid not in seen:
                seen.add(fbid)
                results.append(fbid)
        for m in re.finditer(r'story_fbid=([0-9]{12,})(?:[^0-9]|$)', html):
            fbid = m.group(1)
            if fbid not in seen:
                seen.add(fbid)
                results.append(fbid)
        return results

    def find_next_url(html, current_url):
        """
        Trouve le lien de pagination suivant sur mbasic.facebook.com.
        mbasic utilise des liens 'See More Posts' / 'Voir plus de publications'
        qui contiennent des paramètres de cursor/pagination.
        """
        decoded = html.replace("&amp;", "&").replace("&#38;", "&")

        # Stratégie 1 : lien explicite "See More Posts" / "Voir plus"
        # mbasic place ces liens en bas de page
        see_more_patterns = [
            r'href="(/profile\.php[^"]*timeline[^"]*(?:cursor|after|refid|start)[^"]*)"[^>]*>\s*(?:See More Posts|Voir plus de publications|More Posts|Plus de publications|المزيد)',
            r'href="(/[^"]*(?:cursor|after|refid|start)=[^"]*)"[^>]*>\s*(?:See More|Voir plus|More|Plus|المزيد)',
        ]
        for pat in see_more_patterns:
            m = re.search(pat, decoded, re.I | re.DOTALL)
            if m:
                href = m.group(1)
                if not href.startswith("http"):
                    href = "https://mbasic.facebook.com" + href
                if href.rstrip("/") != current_url.rstrip("/"):
                    return href

        # Stratégie 2 : tout lien contenant des paramètres de cursor/pagination
        # et pointant vers le profil de la page
        all_profile_links = re.findall(
            r'href="(/profile\.php[^"]+)"', decoded
        )
        pagination_params = ["cursor", "after", "refid", "start=", "timeline_cursor"]
        for href in all_profile_links:
            full = "https://mbasic.facebook.com" + href
            if any(p in href for p in pagination_params):
                if full.rstrip("/") != current_url.rstrip("/"):
                    return full

        # Stratégie 3 : chercher un lien contenant le PAGE_ID et un paramètre de pagination
        # Stratégie 3 : chercher tout lien avec PAGE_ID et paramètre de pagination
        pat3 = r'href="(/[^"]*' + PAGE_ID + r'[^"]*(?:cursor|after|refid|start)[^"]*)"'
        for m in re.finditer(pat3, decoded):
            href = m.group(1)
            full = "https://mbasic.facebook.com" + href
            if full.rstrip("/") != current_url.rstrip("/"):
                return full

        return None

    try:
        current_url = f"https://mbasic.facebook.com/profile.php?id={PAGE_ID}&v=timeline"
        page_num = 0
        consecutive_empty = 0

        while len(urls) < MAX_POSTS and page_num < 30:
            page_num += 1
            print(f"[mbasic] Page {page_num} | {len(urls)}/{MAX_POSTS} posts")

            try:
                await page.goto(current_url, wait_until="load", timeout=60000)
                await page.wait_for_timeout(2000)
            except Exception as e:
                print(f"[mbasic] Erreur navigation: {e}")
                break

            html = await page.content()

            # Sauvegarder le HTML des 2 premières pages pour diagnostic
            if page_num <= 2:
                Path(f"debug_mbasic_p{page_num}.html").write_text(
                    html[:80000], encoding="utf-8", errors="replace"
                )
                print(f"[mbasic] HTML sauvegardé : debug_mbasic_p{page_num}.html")

            new_fbids = extract_fbids(html)
            for fbid in new_fbids:
                urls.append(f"https://www.facebook.com/permalink.php?story_fbid={fbid}&id={PAGE_ID}")

            print(f"[mbasic] : {len(new_fbids)} nouveaux | total: {len(urls)}")

            if not new_fbids:
                consecutive_empty += 1
                if consecutive_empty >= 2:
                    print("[mbasic] 2 pages vides consécutives — arrêt.")
                    break
            else:
                consecutive_empty = 0

            if len(urls) >= MAX_POSTS:
                break

            next_url = find_next_url(html, current_url)
            if next_url:
                print(f"[mbasic] -> Suivante: {next_url[:120]}")
                current_url = next_url
            else:
                # Debug complet pour diagnostiquer
                decoded_html = html.replace("&amp;", "&")
                all_profile_links = re.findall(r'href="(/profile\.php[^"]+)"', decoded_html)
                all_links_with_cursor = [l for l in all_profile_links if any(
                    p in l for p in ["cursor", "after", "refid", "start", "timeline"]
                )]
                print(f"[mbasic]  Pas de page suivante trouvée.")
                print(f"  Liens profile totaux: {len(all_profile_links)}")
                print(f"  Liens avec cursor/pagination: {len(all_links_with_cursor)}")
                for l in all_links_with_cursor[:5]:
                    print(f"    {l[:120]}")
                # Chercher "See More" / "Voir plus" dans le HTML
                see_more_ctx = re.findall(r'.{0,100}(?:See More|Voir plus|المزيد).{0,100}', html, re.I)
                print(f"  Contextes 'See More': {see_more_ctx[:3]}")
                break

        print(f"\n[mbasic] {len(urls)} posts en {page_num} pages")

    except Exception as e:
        import traceback
        print(f"[mbasic] Erreur: {e}")
        traceback.print_exception(type(e), e, e.__traceback__)
    finally:
        await page.close()

    return urls[:MAX_POSTS]


async def main():
    BASE_DIR = Path(__file__).resolve().parent
    extractor_js = (BASE_DIR / "extractors.js").read_text(encoding="utf-8")
    collect_js = Path("collect_articles.js").read_text(encoding="utf-8")

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir=str(SESSION_DIR),
            headless=False,
            viewport={"width": 1400, "height": 900},
            args=["--start-maximized"],
        )

        page = await context.new_page()
        await page.goto(PAGE_URL, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_selector("div[role='article'], article", timeout=15000)
        await page.wait_for_timeout(3000)

        clicked_posts_tab = await click_posts_tab(page)
        print(f"[main] click_posts_tab = {clicked_posts_tab}")

        if clicked_posts_tab:
            await page.wait_for_selector("div[role='article'], article", timeout=15000)
            await page.wait_for_timeout(4000)
        else:
            print("[WARN] onglet Posts non trouvé, fallback sur page actuelle")

        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(3000)

        # ── Stratégie 1 : mbasic (pagination, peut atteindre 150+ posts) ──────
        links = await collect_all_post_urls_mbasic(context)

        if len(links) < MAX_POSTS:
            # ── Stratégie 2 : scroll DOM pour compléter ─────────────────────
            print(f"[main] mbasic: {len(links)} posts. Complément via scroll DOM...")
            dom_links = await collect_post_candidates(page, collect_js)
            seen_links = set(links)
            for u in dom_links:
                if u not in seen_links:
                    seen_links.add(u)
                    links.append(u)
            print(f"[main] Total après fusion: {len(links)} posts")

        print(f"[main] {len(links)} liens à traiter")

        posts = []
        failed = []

        for url in links:
            if len(posts) >= MAX_POSTS:
                break

            try:
                post = await extract_one_post(context, url, extractor_js)
                if post is not None:
                    posts.append(post)
                else:
                    failed.append(url)
            except Exception as e:
                failed.append(url)
                import traceback
                print("Erreur post:", url, repr(e))
                traceback.print_exception(type(e), e, e.__traceback__)

        def sort_key(post: PostData):
            if not post.date_post:
                return datetime.min
            try:
                return datetime.strptime(post.date_post, "%d/%m/%Y")
            except Exception:
                return datetime.min

        posts.sort(key=sort_key, reverse=True)

        out = {
            "meta": {
                "scraped_at": datetime.now().isoformat(),
                "page_url": PAGE_URL,
                "page_id": PAGE_ID,
                "posts_requested": MAX_POSTS,
                "posts_returned": len(posts),
                "failed_posts": failed,
            },
            "posts": [p.model_dump() for p in posts],
        }

        print("Nombre de posts extraits :", len(posts))

        Path(OUTPUT_FILE).write_text(
            json.dumps(out, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        await context.close()


if __name__ == "__main__":
    asyncio.run(main())