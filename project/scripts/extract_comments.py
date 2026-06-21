import json


def load_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def is_noise(text):
    if not text:
        return True
    text = text.lower().strip()
    return text in ["image", "tenor", "gif", "photo"]


# FACEBOOK
def extract_facebook(data):
    results = []

    posts = data.get("posts", [])

    for post in posts:
        post_url = post.get("url", "")

        for comment in post.get("comments_full", []):
            text = comment.get("text", "").strip()
            date = comment.get("comment_date", "")
            url = comment.get("url", "") or post_url
            author = comment.get("author", "") or comment.get("user", "")

            if not is_noise(text):
                results.append({
                    "text": text,
                    "date": date,
                    "author": author,
                    "source": "facebook",
                    "url": url
                })

            # replies
            for reply in comment.get("replies", []):
                r_text = reply.get("text", "").strip()
                r_date = reply.get("comment_date", "")
                r_url = reply.get("url", "") or post_url
                r_author = reply.get("author", "") or reply.get("user", "")
                r_author = (
                    reply.get("author")
                    or reply.get("username")
                    or reply.get("user")
                    or ""
                )

                if r_author.lower().strip() == "mae assurances":
                    continue

                if not is_noise(r_text):
                    results.append({
                        "text": r_text,
                        "date": r_date,
                        "author": r_author,
                        "source": "facebook",
                        "url": r_url
                    })

    return results


# LINKEDIN
def extract_linkedin(data):
    results = []

    for post in data:
        post_url = post.get("post_url", "")

        for comment in post.get("commentaires", []):
            text = comment.get("texte", "").strip()
            date = comment.get("date_commentaire", "")
            author = comment.get("auteur", "") or comment.get("author", "")

            if not is_noise(text):
                results.append({
                    "text": text,
                    "date": date,
                    "author": author,
                    "source": "linkedin",
                    "url": post_url
                })

    return results


# FONCTION PRINCIPALE
def process_files(files, output_json="result.json"):
    all_results = []

    for file in files:
        data = load_json(file)

        # détecter format
        if isinstance(data, dict) and "posts" in data:
            extracted = extract_facebook(data)

        elif isinstance(data, list):
            extracted = extract_linkedin(data)

        else:
            extracted = []

        print(f"{file} -> {len(extracted)} commentaires")
        all_results.extend(extracted)

    # supprimer doublons
    unique_results = []
    seen = set()

    for item in all_results:
        key = (item["text"], item["date"], item["source"], item["url"])
        if key not in seen:
            seen.add(key)
            unique_results.append(item)

    # sauvegarder JSON
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(unique_results, f, ensure_ascii=False, indent=4)

    print(f"\nFichier JSON créé : {output_json}")
    print(f"Total : {len(unique_results)} commentaires")


# EXECUTION
files = [
    r"C:\Users\Ranim\Desktop\mae2\project\data\facebook\try_async.json",
    r"C:\Users\Ranim\Desktop\mae2\project\data\linkedin\resultat_extraits.json"
]

process_files(files, r"C:\Users\Ranim\Desktop\mae2\project\data\output\comments_final.json")