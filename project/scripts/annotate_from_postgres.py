import json
import re
import requests
import psycopg2
from pathlib import Path
import time

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "mistral"

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "output"

EXAMPLES_PATH = DATA_DIR / "examples_annotation.json"
LABELS_PATH = DATA_DIR / "labels_reference.txt"

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "mae_reclamations",
    "user": "postgres",
    "password": "ranim123"
}


def load_json(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def parse_labels_reference(path: Path):
    labels = {}
    current_section = None

    with open(path, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()

            if not line:
                continue

            if line.endswith(":"):
                current_section = line[:-1].strip()
                labels[current_section] = []
                continue

            if line.startswith("-") and current_section:
                value = line[1:].strip()
                labels[current_section].append(value)

    return labels


def load_examples(path: Path):
    examples = load_json(path)

    cleaned_examples = []
    for ex in examples:
        cleaned_examples.append({
            "text": ex.get("text", "").strip(),
            "is_reclamation": ex.get("is_reclamation"),
            "category": ex.get("category"),
            "urgency": ex.get("urgency")
        })

    return cleaned_examples


def normalize_json_text(text):
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)
    return text


def build_examples_text(examples):
    formatted = []

    for ex in examples:
        output_json = {
            "is_reclamation": ex["is_reclamation"],
            "category": ex["category"],
            "urgency": ex["urgency"]
        }

        formatted.append(
            f'Commentaire: "{ex["text"]}"\n'
            f'Reponse JSON: {json.dumps(output_json, ensure_ascii=False)}'
        )

    return "\n\n".join(formatted)


def build_prompt(text: str, labels: dict, examples: list):
    is_reclamation_values = " | ".join(labels.get("is_reclamation", []))
    category_values = " | ".join(labels.get("category", []))
    urgency_values = " | ".join(labels.get("urgency", []))

    examples_text = build_examples_text(examples)

    return f"""
Tu es un expert MAE pour classer les commentaires clients.

Retourne UNIQUEMENT un JSON valide avec exactement :
{{
  "is_reclamation": "reclamation" ou "non_reclamation",
  "category": "SERVICE CLIENT" ou "SINISTRE AUTO" ou "SINISTRE IRDS" ou "SINISTRE VIE" ou "non_classée" ou null,
  "urgency": "faible" ou "moyenne" ou "elevee" ou null
}}

========================
DÉFINITION IMPORTANTE
========================

Dans ce projet, "reclamation" signifie tout message client qui nécessite une action ou une réponse de MAE.

Donc "reclamation" inclut :
- plaintes
- problèmes techniques
- dossiers bloqués ou en retard
- absence de réponse
- demandes d'information
- questions liées à assurance / contrat / service

"non_reclamation" signifie uniquement :
- compliment
- félicitation
- souhait
- salutation simple
- spam
- mot isolé sans demande

========================
RÈGLE TRÈS IMPORTANTE
========================

Toute question liée à :
- assurance
- contrat
- souscription
- tarif / prix
- garantie
- attestation
- document
- service MAE
- agence
- compte

EST TOUJOURS UNE RÉCLAMATION :

- is_reclamation = "reclamation"
- category = "SERVICE CLIENT"
- urgency = "faible"

========================
CAS DE RÉCLAMATION
========================

C'est une réclamation si le texte parle de :
- dossier bloqué, en retard, non traité
- absence de réponse (téléphone, mail, agence)
- problème application / inscription / compte
- erreur système
- demande de vérification
- remboursement ou indemnisation non reçu
- document envoyé plusieurs fois
- perte de temps / mauvaise expérience
- frustration client
- toute question liée aux services MAE

========================
NON RÉCLAMATION
========================

Exemples non_reclamation :
- "يستحق كل خير"
- "شخصية عملية و انسانية"
- "ربي يباركلو"
- "يعطيهم الصحة"
- "خدمة ممتازة"
- "شكرا على المجهود"
- "bravo pour vos efforts"
- "service excellent"
- "سنين دايمة"

========================
EXEMPLES RÉCLAMATION
========================

- "Compte adhérent inexistant merci de vérifier"
- "ils ne répondent jamais au téléphone"
- "mon dossier est bloqué"
- "je n'arrive pas à imprimer l'attestation"
- "l'application ne marche pas"
- "document envoyé 4 fois sans réponse"
- "علاش ملفي مازال ما تحلش"
- "ما جاوبني حد"
- "هل تقبلون تأمين دراجة نارية من صنف 125"
- "quel est le prix de l'assurance auto ?"
- "comment faire une souscription ?"

========================
CATÉGORIES
========================

- "SINISTRE AUTO" : voiture, accident auto, assurance auto, véhicule , police, procès-verbal, constat, réparation voiture, dossier accident , sinistre
- "SINISTRE IRDS" : incendie, dégât des eaux, matériel, indemnisation, remboursement, responsabilité civile, habitation, IRDS, équipement endommagé, sinistre
- "SINISTRE VIE" : assurance vie, retraite, pension, bourse d'étude, prévoyance, décès emprunteur, sinistre
- "SERVICE CLIENT" : contact, téléphone, WhatsApp, accueil, absence de réponse, communication, suivi général, service client

========================
PRIORITÉ DE CLASSIFICATION
========================

IMPORTANT :

- Toujours analyser le CONTEXTE principal du message
- Ne pas se baser uniquement sur le fait que c’est une demande

RÈGLE DE PRIORITÉ :

1. Si le texte contient des indices de sinistre (même s'il y a une demande) :
   → utiliser SINISTRE (AUTO / IRDS / VIE)

2. SERVICE CLIENT est utilisé seulement si :
   → il n’y a AUCUN indice de sinistre

EXEMPLES :

- "dossier accident bloqué" → SINISTRE AUTO (pas SERVICE CLIENT)
- "police envoyée 4 fois" → SINISTRE AUTO
- "constat non traité" → SINISTRE AUTO
- "je veux savoir prix assurance" → SERVICE CLIENT

========================
RÈGLE CATÉGORIE
========================

- PRIORITÉ AUX SINISTRES

RÈGLE IMPORTANTE :
- Un retard de dossier seul ne suffit pas pour déterminer la catégorie.
- Il faut utiliser les indices du texte :

  - police / accident / constat / dossier sinistre → SINISTRE AUTO
  - retraite / vie / pension → SINISTRE VIE
  - indemnisation matériel / habitation / dégât → SINISTRE IRDS
  - problème de réponse / contact / suivi / service → SERVICE CLIENT

- SERVICE CLIENT est utilisé seulement si aucun mot lié au sinistre n’est présent


========================
URGENCE
========================

- faible : simple question ou demande d'information
- moyenne : problème réel ou retard
- elevee : blocage grave ou forte insatisfaction

========================
RÈGLE FINALE
========================

- Si non_reclamation → category = null, urgency = null
- Si reclamation sans catégorie claire → category = "non_classée"
- Ne retourne aucune explication

ATTENTION :
Si le message contient seulement un compliment, une félicitation, une bénédiction, un remerciement ou une satisfaction générale,
alors :
- is_reclamation = "non_reclamation"
- category = null
- urgency = null

Même si le texte contient les mots : service, MAE, assurance, responsable, employé, agence.

Exemples :
{examples_text}

========================
COMMENTAIRE
========================

Commentaire à classer :
"{text}"
""".strip()


def validate_result(result: dict, labels: dict):

    valid_is_reclamation = labels.get("is_reclamation", [])
    valid_category = labels.get("category", [])
    valid_urgency = labels.get("urgency", [])

    is_reclamation = result.get("is_reclamation")
    category = result.get("category")
    urgency = result.get("urgency")

    # -------- FIX is_reclamation --------
    if is_reclamation not in valid_is_reclamation:
        is_reclamation = "non_reclamation"

    # -------- FIX urgency --------
    if urgency not in valid_urgency:
        urgency = None

    # -------- FIX category --------
    if is_reclamation == "non_reclamation":
        category = None
    else:
        if category not in valid_category or category is None:
            category = "non_classée"

    validated = {
        "is_reclamation": is_reclamation,
        "category": category,
        "urgency": urgency
    }

    return validated, None


def annotate_comment(text: str, labels: dict, examples: list):
    prompt = build_prompt(text, labels, examples)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=180
        )
        response.raise_for_status()
    except Exception as e:
        return None, None, f"erreur_ollama: {str(e)}"

    raw = response.json().get("response", "").strip()
    raw_json = normalize_json_text(raw)

    try:
        parsed = json.loads(raw_json)
    except json.JSONDecodeError:
        return None, raw, "json invalide"

    validated, _ = validate_result(parsed, labels)

    return validated, raw, None


def get_comments_to_annotate():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, text_original, clean_text
        FROM comments
        WHERE id NOT IN (
            SELECT comment_id FROM annotations
        )
        ORDER BY id
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def save_annotation(comment_id, result, processing_status="annotated", review_reason=None, llm_raw_response=None):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO annotations (
            comment_id,
            is_reclamation,
            category,
            urgency,
            processing_status,
            review_reason,
            llm_raw_response
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (comment_id) DO UPDATE SET
            is_reclamation = EXCLUDED.is_reclamation,
            category = EXCLUDED.category,
            urgency = EXCLUDED.urgency,
            processing_status = EXCLUDED.processing_status,
            review_reason = EXCLUDED.review_reason,
            llm_raw_response = EXCLUDED.llm_raw_response,
            updated_at = CURRENT_TIMESTAMP
    """, (
        comment_id,
        result.get("is_reclamation") if result else None,
        result.get("category") if result else None,
        result.get("urgency") if result else None,
        processing_status,
        review_reason,
        llm_raw_response
    ))

    conn.commit()
    cur.close()
    conn.close()


def check_required_files():
    required = [EXAMPLES_PATH, LABELS_PATH]
    missing = [str(p) for p in required if not p.exists()]

    if missing:
        raise FileNotFoundError(
            "Fichiers manquants :\n- " + "\n- ".join(missing)
        )


def main():
    check_required_files()

    labels = parse_labels_reference(LABELS_PATH)
    examples = load_examples(EXAMPLES_PATH)
    rows = get_comments_to_annotate()

    print(f"Modèle Ollama : {MODEL}")
    print(f"Commentaires à annoter : {len(rows)}")

    for i, row in enumerate(rows, start=1):
        comment_id, text_original, clean_text = row

        text = (clean_text or "").strip()
        if not text:
            text = (text_original or "").strip()

        result, raw_response, review_reason = annotate_comment(text, labels, examples)

        if result is None:
            save_annotation(
                comment_id=comment_id,
                result=None,
                processing_status="to_review",
                review_reason=review_reason,
                llm_raw_response=raw_response
            )
            print(f"[{i}/{len(rows)}] à revoir -> {review_reason}")
            time.sleep(1)
            continue

        save_annotation(
            comment_id=comment_id,
            result=result,
            processing_status="annotated",
            review_reason=None,
            llm_raw_response=raw_response
        )
        print(f"[{i}/{len(rows)}] annoté")
        time.sleep(1)


if __name__ == "__main__":
    main()