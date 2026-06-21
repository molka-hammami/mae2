import json
import re
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
JUDGE_MODEL = "mistral"


ALLOWED_IS_RECLAMATION = {"reclamation", "non_reclamation"}
ALLOWED_CATEGORIES = {
    "SERVICE CLIENT",
    "SINISTRE AUTO",
    "SINISTRE IRDS",
    "SINISTRE VIE",
    "non_classée",
    None
}
ALLOWED_URGENCY = {"faible", "moyenne", "elevee", None}


def extract_json(text: str):
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)
    return text


def normalize_judge_result(data: dict, original_prediction: dict):
    corrected = data.get("corrected_prediction", {})

    is_reclamation = corrected.get("is_reclamation")
    category = corrected.get("category")
    urgency = corrected.get("urgency")

    if is_reclamation not in ALLOWED_IS_RECLAMATION:
        is_reclamation = "non_reclamation"

    if is_reclamation == "non_reclamation":
        category = None
        urgency = None
    else:
        if category not in ALLOWED_CATEGORIES or category is None:
            category = "non_classée"

        if urgency not in ALLOWED_URGENCY:
            urgency = "moyenne"

    # Ne pas faire confiance au verdict du LLM :
    # on recalcule programmatiquement en comparant les valeurs réelles
    actually_changed = (
        is_reclamation != original_prediction.get("is_reclamation")
        or category != original_prediction.get("category")
        or urgency != original_prediction.get("urgency")
    )
    verdict = "reject" if actually_changed else "accept"

    return {
        "verdict": verdict,
        "corrected_prediction": {
            "is_reclamation": is_reclamation,
            "category": category,
            "urgency": urgency
        },
        "reason": data.get("reason", "")
    }


def judge_prediction(text: str, prediction: dict):
    # Garder uniquement les 3 champs utiles pour le judge
    # Les champs "source" et "ml_confidence" perturbent le modèle
    # et causent un faux "reject" même quand la prédiction est correcte
    clean_prediction = {
        "is_reclamation": prediction.get("is_reclamation"),
        "category": prediction.get("category"),
        "urgency": prediction.get("urgency"),
    }

    prompt = f"""
Tu es un juge expert MAE.

Ton rôle est d'évaluer si une prédiction de classification est correcte.

Tu dois vérifier :
1. is_reclamation
2. category
3. urgency

========================
RÈGLES MÉTIER
========================

"reclamation" signifie tout message client qui nécessite une action ou une réponse MAE.

Inclure dans reclamation :
- plainte
- problème technique
- dossier bloqué
- absence de réponse
- demande d'information
- question assurance / contrat / tarif / garantie / attestation / agence / compte

"non_reclamation" signifie uniquement :
- compliment
- félicitation
- remerciement
- souhait
- salutation simple
- spam
- texte vague sans demande claire

IMPORTANT ARABE / TUNISIEN :

Toute question contenant :
- التسجيل
- inscription
- الترسيم
- التسجيل متاح
- كيفاش نسجل
- نحب نسجل
- compte
- application

est une réclamation de type SERVICE CLIENT.

Résultat attendu :
- is_reclamation = "reclamation"
- category = "SERVICE CLIENT"
- urgency = "faible"

========================
RÈGLE DE COHÉRENCE (TRÈS IMPORTANT)
========================

- Si la prédiction est correcte :
  → verdict = "accept"
  → corrected_prediction DOIT être IDENTIQUE à la prédiction

- Si tu modifies au moins un champ :
  → verdict = "reject"

- Ne retourne JAMAIS verdict = "reject" si corrected_prediction est identique à la prédiction

Catégories :
- SINISTRE AUTO : accident, voiture, véhicule, constat, police, réparation auto, dossier accident, sinistre
- SINISTRE IRDS : incendie, dégât des eaux, habitation, matériel, indemnisation, responsabilité civile, sinistre
- SINISTRE VIE : assurance vie, retraite, pension, décès, prévoyance, bourse d'étude, sinistre
- SERVICE CLIENT : téléphone, WhatsApp, accueil, compte, application, attestation, agence, contact, service client
- non_classée : réclamation réelle mais catégorie pas claire

========================
RÈGLE DE PRIORITÉ DES SINISTRES (TRÈS IMPORTANT)
========================

Si le commentaire contient un mot lié à un sinistre,
alors la catégorie DOIT être un SINISTRE,
et JAMAIS "SERVICE CLIENT".

Types de sinistres :

1. SINISTRE AUTO :
- accident
- voiture
- véhicule
- constat
- police
- réparation
- choc

2. SINISTRE IRDS (habitation, incendie, dégâts) :
- incendie
- dégât des eaux
- fuite
- maison
- appartement
- habitation
- sinistre habitation

3. SINISTRE VIE :
- assurance vie
- décès
- retraite
- pension
- prévoyance
- capital

========================
RÈGLE DE PRIORITÉ ABSOLUE
========================

Si un mot de sinistre est détecté :
→ la catégorie DOIT être le type de SINISTRE correspondant

Même si le message contient :
- absence de réponse
- service client
- téléphone
- application
- retard
- suivi

Les sinistres sont TOUJOURS prioritaires sur SERVICE CLIENT.

========================
EXEMPLES
========================

"j’ai envoyé le constat mais personne ne répond"
→ SINISTRE AUTO

"incendie dans mon appartement et toujours pas de réponse"
→ SINISTRE IRDS

"problème avec mon assurance vie et aucun retour"
→ SINISTRE VIE

Urgence :
- faible : simple question ou information
- moyenne : problème réel, retard, dossier bloqué, absence de réponse
- elevee : colère forte, menace, scandale, urgence grave, préjudice important

========================
COMMENTAIRE
========================

{text}

========================
PRÉDICTION À ÉVALUER
========================

{json.dumps(clean_prediction, ensure_ascii=False)}

========================
TA RÉPONSE
========================

Retourne uniquement un JSON valide :

{{
  "verdict": "accept" ou "reject",
  "corrected_prediction": {{
    "is_reclamation": "reclamation" ou "non_reclamation",
    "category": "SERVICE CLIENT" ou "SINISTRE AUTO" ou "SINISTRE IRDS" ou "SINISTRE VIE" ou "non_classée" ou null,
    "urgency": "faible" ou "moyenne" ou "elevee" ou null
  }},
  "reason": "raison courte"
}}
""".strip()

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": JUDGE_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )
        response.raise_for_status()

        raw = response.json().get("response", "").strip()
        raw_json = extract_json(raw)
        parsed = json.loads(raw_json)

        return normalize_judge_result(parsed, clean_prediction)

    except Exception as e:
        return {
            "verdict": "error",
            "corrected_prediction": prediction,
            "reason": f"judge_error: {str(e)}"
        }