from pathlib import Path
import sys
import psycopg2
from psycopg2.extras import Json
from api import predict_comment_hybrid, should_use_judge, apply_business_rules
from judge import judge_prediction

# =========================
# Chemins
# =========================
BASE_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = BASE_DIR / "scripts"

# Permet d'importer api.py depuis scripts/
sys.path.append(str(SCRIPTS_DIR))

# =========================
# Config PostgreSQL
# =========================
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "mae",
    "user": "postgres",
    "password": "ranim123"
}


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("""
        SELECT c.id, c.clean_text
        FROM comments c
        WHERE c.clean_text IS NOT NULL
          AND TRIM(c.clean_text) <> ''
          AND NOT EXISTS (
              SELECT 1
              FROM annotations a
              WHERE a.comment_id = c.id
          )
        ORDER BY c.id;
    """)

    rows = cur.fetchall()
    print(f"{len(rows)} commentaires à classifier.")

    annotations_count = 0
    cases_count = 0

    for comment_id, clean_text in rows:
        try:
            prediction = predict_comment_hybrid(clean_text)

            if should_use_judge(prediction):
                judge_result = judge_prediction(clean_text, prediction)

                if judge_result["verdict"] == "reject":
                    result = judge_result["corrected_prediction"]
                    processing_status = "corrected_by_judge"
                else:
                    result = prediction
                    processing_status = "validated_by_judge"
            else:
                result = prediction
                judge_result = {
                    "verdict": "skipped"
                }
                processing_status = "no_judge"
            
            result = apply_business_rules(clean_text, result)
            is_reclamation = result.get("is_reclamation")
            category = result.get("category")
            urgency = result.get("urgency")

            cur.execute("""
                INSERT INTO annotations (
                    comment_id,
                    is_reclamation,
                    category,
                    urgency,
                    processing_status,
                    review_reason,
                    llm_raw_response,
                    updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (comment_id) DO UPDATE SET
                    is_reclamation = EXCLUDED.is_reclamation,
                    category = EXCLUDED.category,
                    urgency = EXCLUDED.urgency,
                    processing_status = EXCLUDED.processing_status,
                    review_reason = EXCLUDED.review_reason,
                    llm_raw_response = EXCLUDED.llm_raw_response,
                    updated_at = NOW();
            """, (
                comment_id,
                is_reclamation,
                category,
                urgency,
                processing_status,
                judge_result.get("reason"), 
                Json({
                    "initial_prediction": prediction,
                    "judge_result": judge_result,
                    "final_result": result
                })
            ))

            annotations_count += 1

            if is_reclamation == "reclamation":
                cur.execute("""
                    INSERT INTO reclamation_cases (
                        comment_id,
                        status,
                        opened_at
                    )
                    VALUES (%s, %s, NOW())
                    ON CONFLICT (comment_id) DO NOTHING;
                """, (
                    comment_id,
                    "EN_ATTENTE"
                ))

                cases_count += 1

        except Exception as e:
            print(f"Erreur commentaire {comment_id}: {e}")

    conn.commit()
    cur.close()
    conn.close()

    print(f"{annotations_count} annotations insérées/mises à jour.")
    print(f"{cases_count} reclamation_cases créées.")


if __name__ == "__main__":
    main()