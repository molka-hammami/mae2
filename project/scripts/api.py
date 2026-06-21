from pathlib import Path
import json
import joblib
import requests
from fastapi import FastAPI
from pydantic import BaseModel
from judge import judge_prediction

# =========================
# Initialisation API
# =========================
app = FastAPI(title="API Réclamations Assurance - Hybride")

# =========================
# Chemins
# =========================
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

# =========================
# Charger modèles et vectorizers ML
# =========================
model_reclamation = joblib.load(MODELS_DIR / "model_reclamation.pkl")
model_category = joblib.load(MODELS_DIR / "model_category.pkl")
model_urgency = joblib.load(MODELS_DIR / "model_urgency.pkl")

vectorizer_reclamation = joblib.load(MODELS_DIR / "vectorizer_reclamation.pkl")
vectorizer_category = joblib.load(MODELS_DIR / "vectorizer_category.pkl")
vectorizer_urgency = joblib.load(MODELS_DIR / "vectorizer_urgency.pkl")

# =========================
# Seuils hybrides
# =========================
# ML sur que ce n'est pas une réclamation
ML_NON_RECLAMATION_THRESHOLD = 0.40

# Zone à partir de laquelle on considère que ML penche vers réclamation
ML_RECLAMATION_THRESHOLD = 0.60

# Si ML est sur que c'est une réclamation, mais pas sur de la catégorie
ML_CATEGORY_CONFIDENCE_THRESHOLD = 0.55

# =========================
# Config LLM
# =========================
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "mistral"

# =========================
# Schéma entrée
# =========================
class CommentRequest(BaseModel):
    text: str

# =========================
# Fonction ML avec scores
# =========================
def predict_comment_ml_with_scores(text: str):
    text = text.strip()

    # -------- Réclamation --------
    text_vec_rec = vectorizer_reclamation.transform([text])
    rec_pred = model_reclamation.predict(text_vec_rec)[0]
    rec_proba = model_reclamation.predict_proba(text_vec_rec)[0]
    rec_conf = float(max(rec_proba))

    if rec_pred != "reclamation":
        return {
            "is_reclamation": "non_reclamation",
            "category": None,
            "urgency": None,
            "confidence": {
                "reclamation": rec_conf,
                "category": None,
                "urgency": None
            }
        }

    # -------- Catégorie --------
    text_vec_cat = vectorizer_category.transform([text])
    cat_pred = model_category.predict(text_vec_cat)[0]
    cat_proba = model_category.predict_proba(text_vec_cat)[0]
    cat_conf = float(max(cat_proba))

    # -------- Urgence --------
    text_vec_urg = vectorizer_urgency.transform([text])
    urg_pred = model_urgency.predict(text_vec_urg)[0]
    urg_proba = model_urgency.predict_proba(text_vec_urg)[0]
    urg_conf = float(max(urg_proba))

    return {
        "is_reclamation": "reclamation",
        "category": cat_pred,
        "urgency": urg_pred,
        "confidence": {
            "reclamation": rec_conf,
            "category": cat_conf,
            "urgency": urg_conf
        }
    }

# =========================
# Fonction LLM via Ollama
# =========================
def predict_comment_llm(text: str):
    prompt = f"""
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
- "SERVICE CLIENT" :uniquement si le texte parle clairement de contact, téléphone, WhatsApp, accueil, absence de réponse, communication, suivi général, service client

IMPORTANT :
Si le commentaire parle d’un dossier, d’une situation bloquée, d’un retard, ou d’un problème général
MAIS sans indice clair de :
- auto / accident / voiture / constat / police
- vie / retraite / décès / pension / épargne
- IRDS / matériel / habitation / dégâts / incendie
- service client / téléphone / application / compte / agence / attestation

Alors :
- is_reclamation = "reclamation"
- category = "non_classée"

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
  - contact / téléphone / application / compte / agence / attestation → SERVICE CLIENT
Mais :
retard général / dossier bloqué / situation bloquée / absence de réponse sans contexte précis → non_classée

- SERVICE CLIENT est utilisé seulement si aucun mot lié au sinistre n’est présent

EXEMPLES :
"j’ai suivi toutes les étapes demandées mais la situation reste bloquée"
→ {{"is_reclamation": "reclamation", "category": "non_classée", "urgency": "moyenne"}}

"رغم اني بعثت كل شيء، الملف مازال معطل وما نعرفش السبب"
→ {{"is_reclamation": "reclamation", "category": "non_classée", "urgency": "moyenne"}}


========================
URGENCE
========================

faible = simple question / information / souscription / tarif / document
moyenne = problème réel, retard, dossier bloqué, absence de réponse, remboursement en attente
elevee = forte colère, menace, scandale, urgence grave, très longue durée, préjudice important

========================
RÈGLE FINALE
========================

- Si non_reclamation → category = null, urgency = null
- Si reclamation sans catégorie claire → category = "non_classée"
- Ne retourne aucune explication

IMPORTANT :

Si le commentaire est vague, très court, ou ne contient pas
assez d'information pour comprendre un problème lié à MAE,
alors :

- is_reclamation = "non_reclamation"
- category = null
- urgency = null

Exemples :
- "لا أستطيع"
- "??"
- "ok"
- "non"

ATTENTION :
Si le message contient seulement un compliment, une félicitation, une bénédiction, un remerciement ou une satisfaction générale,
alors :
- is_reclamation = "non_reclamation"
- category = null
- urgency = null

Même si le texte contient les mots : service, MAE, assurance, responsable, employé, agence.

========================
COMMENTAIRE
========================

\"\"\"{text}\"\"\"
""".strip()

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False
        },
        timeout=120
    )
    response.raise_for_status()

    result = response.json()
    raw_text = result.get("response", "").strip()
    raw_text = raw_text.replace("```json", "").replace("```", "").strip()

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        return {
            "is_reclamation": "non_reclamation",
            "category": None,
            "urgency": None,
            "llm_error": "json_invalide",
            "raw_response": raw_text
        }

    # Normalisation de sécurité
    llm_is_reclamation = parsed.get("is_reclamation")
    llm_category = parsed.get("category")
    llm_urgency = parsed.get("urgency")

    if llm_is_reclamation == "non_reclamation":
        return {
            "is_reclamation": "non_reclamation",
            "category": None,
            "urgency": None
        }

    allowed_categories = {
        "SERVICE CLIENT",
        "SINISTRE AUTO",
        "SINISTRE IRDS",
        "SINISTRE VIE",
        "non_classée",
        None
    }

    if llm_is_reclamation == "reclamation":
        if llm_category not in allowed_categories or llm_category is None or llm_category == "":
            llm_category = "non_classée"

    return {
        "is_reclamation": llm_is_reclamation,
        "category": llm_category,
        "urgency": llm_urgency
    }

def apply_business_rules(text: str, result: dict) -> dict:
    t = text.lower()

    auto_keywords = [
        "police",
        "procès-verbal",
        "proces-verbal",
        "constat",
        "accident",
        "véhicule",
        "vehicule",
        "voiture",
        "auto"
    ]

    if result.get("is_reclamation") == "reclamation":
        if any(k in t for k in auto_keywords):
            result["category"] = "SINISTRE AUTO"

    return result

# =========================
# Décision hybride
# =========================
def predict_comment_hybrid(text: str):
    ml_result = predict_comment_ml_with_scores(text)
    rec_conf = ml_result["confidence"]["reclamation"]
    cat_conf = ml_result["confidence"]["category"]

    # Cas A :
    # ML est sur que c'est non_reclamation -> on garde ML
    if (
        ml_result["is_reclamation"] == "non_reclamation"
        and rec_conf < ML_NON_RECLAMATION_THRESHOLD
    ):
        return {
            "source": "ml",
            "is_reclamation": "non_reclamation",
            "category": None,
            "urgency": None,
            "ml_confidence": ml_result["confidence"]
        }

    # Cas B :
    # ML hésite sur réclamation / non_reclamation -> on appelle le LLM
    if ML_NON_RECLAMATION_THRESHOLD <= rec_conf <= ML_RECLAMATION_THRESHOLD:
        llm_result = apply_business_rules(text, predict_comment_llm(text))
        return {
            "source": "llm",
            "is_reclamation": llm_result.get("is_reclamation"),
            "category": llm_result.get("category"),
            "urgency": llm_result.get("urgency"),
            "ml_confidence": ml_result["confidence"]
        }

    # Cas C :
    # ML est sur que c'est une réclamation, mais pas sur de la catégorie -> LLM
    if (
        ml_result["is_reclamation"] == "reclamation"
        and cat_conf is not None
        and cat_conf < ML_CATEGORY_CONFIDENCE_THRESHOLD
    ):
        llm_result = apply_business_rules(text, predict_comment_llm(text))
        return {
            "source": "llm",
            "is_reclamation": llm_result.get("is_reclamation"),
            "category": llm_result.get("category"),
            "urgency": llm_result.get("urgency"),
            "ml_confidence": ml_result["confidence"]
        }

    # Cas D :
    # ML est sur que c'est une réclamation et catégorie assez sure -> on garde ML
    return {
        "source": "ml",
        "is_reclamation": ml_result["is_reclamation"],
        "category": ml_result["category"],
        "urgency": ml_result["urgency"],
        "ml_confidence": ml_result["confidence"]
    }

def should_use_judge(prediction: dict):
    # Cas LLM : utiliser ML confidence pour décider
    if prediction.get("source") == "llm":
        ml_conf = prediction.get("ml_confidence", {})

        # si ML n'est pas sur de la catégorie → judge
        if ml_conf.get("category") is not None and ml_conf.get("category") < 0.6:
            return True

        # sinon → PAS de judge
        return False

    # Cas ML : logique classique
    confidence = prediction.get("ml_confidence", {})

    if confidence.get("reclamation") is not None:
        if confidence["reclamation"] < 0.75:
            return True

    if confidence.get("category") is not None:
        if confidence["category"] < 0.70:
            return True

    if prediction.get("category") == "non_classée":
        return True

    if prediction.get("urgency") == "elevee":
        return True

    return False

def judge_changed_prediction(prediction: dict, corrected: dict):
    # Comparer uniquement les 3 champs métier (ignorer source/ml_confidence)
    return (
        prediction.get("is_reclamation") != corrected.get("is_reclamation")
        or prediction.get("category") != corrected.get("category")
        or prediction.get("urgency") != corrected.get("urgency")
    )

def force_reclamation_if_keywords(text: str, result: dict):
    t = text.lower()

    arabic_keywords = ["ملف", "معطل", "مازال", "بعثت", "ما جاوب"]

    if any(k in t for k in arabic_keywords):
        result["is_reclamation"] = "reclamation"

    return result

# =========================
# Routes
# =========================
@app.get("/")
def root():
    return {"message": "API hybride réclamations active"}

@app.post("/predict")
def predict(request: CommentRequest):
    text = request.text.strip()

    prediction = predict_comment_hybrid(text)
    prediction = force_reclamation_if_keywords(text, prediction)

    # décider si on appelle le judge
    if should_use_judge(prediction):
        judge_result = judge_prediction(text, prediction)

        corrected = judge_result.get("corrected_prediction", prediction)

        if judge_changed_prediction(prediction, corrected):
            final_result = corrected
            processing_status = "corrected_by_judge"
        else:
            final_result = prediction
            processing_status = "validated_by_judge"
    else:
        judge_result = {
            "verdict": "skipped",
            "reason": "ML confiant"
        }
        final_result = prediction
        processing_status = "no_judge"

    return {
        "llm_prediction": prediction,
        "result": final_result,
        "judge": judge_result,
        "processing_status": processing_status
    }