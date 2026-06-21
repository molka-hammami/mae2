import asyncio
import json
from datetime import datetime, timedelta
import re
import calendar
from linkedin_scraper import BrowserManager, CompanyPostsScraper


def subtract_months(dt, months):
    year = dt.year
    month = dt.month - months

    while month <= 0:
        month += 12
        year -= 1

    day = min(dt.day, calendar.monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def subtract_years(dt, years):
    year = dt.year - years
    day = dt.day

    if dt.month == 2 and dt.day == 29 and not calendar.isleap(year):
        day = 28

    return dt.replace(year=year, day=day)


def convertir_date_linkedin(date_str):
    if not date_str:
        return None

    if hasattr(date_str, "strftime"):
        return date_str.strftime("%d/%m/%Y")

    s = str(date_str).strip().lower()
    s = s.split("•")[0].strip()

    now = datetime.now()

    if s in ["today", "aujourd’hui", "aujourd'hui"]:
        return now.strftime("%d/%m/%Y")

    if s in ["yesterday", "hier"]:
        return (now - timedelta(days=1)).strftime("%d/%m/%Y")

    short_patterns = [
        (r"^(\d+)\s*d$", "days"),
        (r"^(\d+)\s*w$", "weeks"),
        (r"^(\d+)\s*mo$", "months"),
        (r"^(\d+)\s*m$", "months"),
        (r"^(\d+)\s*y$", "years"),
    ]

    for pattern, unit in short_patterns:
        match = re.match(pattern, s)
        if match:
            value = int(match.group(1))

            if unit == "days":
                return (now - timedelta(days=value)).strftime("%d/%m/%Y")
            if unit == "weeks":
                return (now - timedelta(weeks=value)).strftime("%d/%m/%Y")
            if unit == "months":
                return subtract_months(now, value).strftime("%d/%m/%Y")
            if unit == "years":
                return subtract_years(now, value).strftime("%d/%m/%Y")

    long_patterns = [
        (r"^(\d+)\s+day[s]?\s+ago$", "days"),
        (r"^(\d+)\s+week[s]?\s+ago$", "weeks"),
        (r"^(\d+)\s+month[s]?\s+ago$", "months"),
        (r"^(\d+)\s+year[s]?\s+ago$", "years"),
    ]

    for pattern, unit in long_patterns:
        match = re.match(pattern, s)
        if match:
            value = int(match.group(1))

            if unit == "days":
                return (now - timedelta(days=value)).strftime("%d/%m/%Y")
            if unit == "weeks":
                return (now - timedelta(weeks=value)).strftime("%d/%m/%Y")
            if unit == "months":
                return subtract_months(now, value).strftime("%d/%m/%Y")
            if unit == "years":
                return subtract_years(now, value).strftime("%d/%m/%Y")

    return str(date_str)


async def scrape_with_real_comments():
    target_url = "https://www.linkedin.com/company/mae-assurance/"
    filename = "resultat_extraits.json"

    print(f"Démarrage de l'extraction profonde sur : {target_url}")

    async with BrowserManager(headless=False) as browser:
        await browser.load_session("linkedin_session.json")
        page = browser.page

        # Timeouts plus larges pour éviter les plantages LinkedIn
        page.set_default_timeout(60000)
        page.set_default_navigation_timeout(60000)

        scraper = CompanyPostsScraper(page)
        posts = await scraper.scrape(target_url, limit=20)

        results = []

        for post in posts:
            print(f"Analyse du post : {post.linkedin_url}")

            try:
                await page.goto(
                    post.linkedin_url,
                    wait_until="domcontentloaded",
                    timeout=60000
                )
                await asyncio.sleep(5)
            except Exception as e:
                print(f"Erreur ouverture post {post.linkedin_url} : {e}")
                continue

            try:
                await page.wait_for_selector(
                    ".comments-comment-item__main-content",
                    timeout=10000
                )
            except Exception:
                print("Aucun commentaire trouvé ou chargement trop lent pour ce post.")

            comment_text_elements = await page.query_selector_all(
                ".comments-comment-item__main-content"
            )

            extracted_comments = []

            for el in comment_text_elements:
                try:
                    comment_text = (await el.inner_text()).strip()
                except Exception:
                    comment_text = ""

                comment_date = "Date inconnue"
                author = "Auteur inconnu"
                comment_link = None
                comment_id = None

                try:
                    comment_container = await el.evaluate_handle("""
                        node => {
                            let p = node;
                            while (p) {
                                if (p.getAttribute && p.getAttribute("data-id")) {
                                    return p;
                                }
                                p = p.parentElement;
                            }
                            return null;
                        }
                    """)
                except Exception:
                    comment_container = None

                if comment_container:
                    try:
                        author_el = await comment_container.query_selector(
                            ".comments-comment-meta__description-title"
                        )

                        if not author_el:
                            author_el = await comment_container.query_selector(
                                ".comments-post-meta__name-text"
                            )

                        if not author_el:
                            author_el = await comment_container.query_selector(
                                "span[dir='ltr']"
                            )

                        if author_el:
                            author = (await author_el.inner_text()).strip()
                    except Exception:
                        pass

                    try:
                        date_el = await comment_container.query_selector(
                            "time.comments-comment-meta__data"
                        )
                        if not date_el:
                            date_el = await comment_container.query_selector("time")

                        if date_el:
                            raw_date = (await date_el.inner_text()).strip()
                            comment_date = convertir_date_linkedin(raw_date)
                    except Exception:
                        pass

                    # ---- AJOUTER TON CODE ICI ----
                    try:
                        comment_id = await comment_container.get_attribute("data-id")
                    except Exception:
                        pass

                    try:
                        link_el = await comment_container.query_selector(
                            "a[href*='/feed/update/'], a[href*='commentUrn='], a[href*='activity-'], a[href*='replyUrn=']"
                        )

                        if not link_el:
                            link_el = await comment_container.query_selector("time >> xpath=ancestor::a[1]")

                        if not link_el:
                            candidates = await comment_container.query_selector_all("a[href]")
                            for a in candidates:
                                href = await a.get_attribute("href")
                                if href and (
                                    "commentUrn=" in href
                                    or "replyUrn=" in href
                                    or "/feed/update/" in href
                                ):
                                    link_el = a
                                    break

                        if link_el:
                            href = await link_el.get_attribute("href")
                            if href:
                                if href.startswith("/"):
                                    comment_link = f"https://www.linkedin.com{href}"
                                else:
                                    comment_link = href
                    except Exception:
                        pass

                    if not comment_link and comment_id and post.linkedin_url:
                        comment_link = f"{post.linkedin_url}?commentId={comment_id}"
                    # ---- FIN AJOUT ----

                extracted_comments.append({
                    "auteur": author,
                    "date_commentaire": comment_date,
                    "texte": comment_text,
                    "lien_commentaire": comment_link
                })

            results.append({
                "post_url": post.linkedin_url,
                "post_text": post.text,
                "date_post": convertir_date_linkedin(post.posted_date),
                "nombre_commentaires": post.comments_count,
                "commentaires": extracted_comments
            })

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=4)

    print(f"Terminé ! Regarde le fichier : {filename}")


if __name__ == "__main__":
    asyncio.run(scrape_with_real_comments())