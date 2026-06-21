import json
from pathlib import Path

import psycopg2

BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_PATH = BASE_DIR / "data" / "output" / "comments_cleaned.json"

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "mae",
    "user": "postgres",
    "password": "ranim123"
}


def load_json(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def normalize_value(value):
    if value is None:
        return None
    value = str(value).strip()
    return value if value else None


def main():
    data = load_json(INPUT_PATH)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    inserted = 0
    skipped_empty = 0

    for item in data:
        source = normalize_value(item.get("source"))
        comment_date = normalize_value(item.get("date"))
        url = normalize_value(item.get("url"))
        author_name = normalize_value(item.get("author"))
        text_original = normalize_value(item.get("text"))
        clean_text = normalize_value(item.get("clean_text"))

        # ignorer les lignes sans texte utile
        if not clean_text and not text_original:
            skipped_empty += 1
            continue

        cur.execute(
            """
            INSERT INTO comments (
                source,
                author_name,
                comment_date,
                url,
                text_original,
                clean_text
            )
            SELECT %s, %s, %s, %s, %s, %s
            WHERE NOT EXISTS (
                SELECT 1
                FROM comments c
                WHERE
                    (
                        %s IS NOT NULL
                        AND TRIM(%s) <> ''
                        AND c.url = %s
                    )
                    OR
                    (
                        %s IS NOT NULL
                        AND TRIM(%s) <> ''
                        AND %s IS NOT NULL
                        AND TRIM(%s) <> ''
                        AND LOWER(TRIM(c.author_name)) = LOWER(TRIM(%s))
                        AND LOWER(TRIM(c.clean_text)) = LOWER(TRIM(%s))
                    )
            )
            """,
            (
                source,
                author_name,
                comment_date,
                url,
                text_original,
                clean_text,

                # condition url
                url,
                url,
                url,

                # condition author_name + clean_text
                author_name,
                author_name,
                clean_text,
                clean_text,
                author_name,
                clean_text,
            )
        )

        if cur.rowcount > 0:
            inserted += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"Chargement terminé dans PostgreSQL. {inserted} lignes insérées.")
    print(f"Lignes ignorées sans texte utile : {skipped_empty}")


if __name__ == "__main__":
    main()