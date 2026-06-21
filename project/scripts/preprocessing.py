import json
import re
import string

def clean_text(text):
    if not text:
        return ""

    text = text.lower()

    # supprimer emails
    text = re.sub(r"\S+@\S+", "", text)

    # supprimer urls
    text = re.sub(r"http\S+|www\S+", "", text)

    # supprimer hashtags
    text = re.sub(r"#\w+", "", text)

    # supprimer ponctuation
    text = text.translate(str.maketrans('', '', string.punctuation))

    # supprimer symboles spéciaux
    text = re.sub(r"[•…“”‘’«»]", " ", text)

    # espaces multiples
    text = re.sub(r"\s+", " ", text).strip()

    return text


# charger fichier
with open("../data/output/comments_final.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# appliquer cleaning
for item in data:
    item["clean_text"] = clean_text(item.get("text", ""))

# sauvegarder
with open("../data/output/comments_cleaned.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("Cleaning terminé")