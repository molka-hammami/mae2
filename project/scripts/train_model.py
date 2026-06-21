import pandas as pd
import joblib
from pathlib import Path

# =========================
# 1. Charger les données
# =========================
df = pd.read_csv("../data/output/dataset_ml.csv", encoding="utf-8")
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

print(df.head())
print(df.isnull().sum())


# =========================
# 2. Modèle Réclamation
# =========================
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

df1 = df.dropna(subset=["is_reclamation"])

X = df1["clean_text"]
y = df1["is_reclamation"]

vectorizer = TfidfVectorizer(
    max_features=5000,
    ngram_range=(1,2),
    min_df=2
)
X_vec = vectorizer.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_vec, y, test_size=0.2, random_state=42
)

model_reclamation = LogisticRegression(class_weight='balanced')
model_reclamation.fit(X_train, y_train)

y_pred = model_reclamation.predict(X_test)

print("=== MODELE RECLAMATION ===")
print(classification_report(y_test, y_pred))


# =========================
# 3. Modèle Catégorie
# =========================
df2 = df[
    (df["is_reclamation"] == "reclamation") &
    (df["category"].notnull())
]

X = df2["clean_text"]
y = df2["category"]

vectorizer_cat = TfidfVectorizer(max_features=7000, ngram_range=(1,2))
X_vec = vectorizer_cat.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_vec, y, test_size=0.2, random_state=42
)

model_category = LogisticRegression(class_weight='balanced', max_iter=1000)
model_category.fit(X_train, y_train)

y_pred = model_category.predict(X_test)

print("=== MODELE CATEGORIE ===")
print(classification_report(y_test, y_pred))

# =========================
# 4. Modèle Urgence
# =========================

df3 = df[
    (df["is_reclamation"] == "reclamation") &
    (df["urgency"].notnull())
]

X = df3["clean_text"]
y = df3["urgency"]

vectorizer_urg = TfidfVectorizer(max_features=5000, ngram_range=(1,2))
X_vec = vectorizer_urg.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_vec, y, test_size=0.2, random_state=42
)

model_urgency = LogisticRegression(class_weight='balanced', max_iter=1000)
model_urgency.fit(X_train, y_train)

y_pred = model_urgency.predict(X_test)

print("=== MODELE URGENCE ===")
print(classification_report(y_test, y_pred))

# =========================
# 5. Test manuel
# =========================
def predict_comment(text):
    text_vec = vectorizer.transform([text])
    is_rec = model_reclamation.predict(text_vec)[0]

    if is_rec == "non_reclamation":
        return "NON_RECLAMATION"

    text_vec_cat = vectorizer_cat.transform([text])
    cat = model_category.predict(text_vec_cat)[0]

    return cat


print(predict_comment("je ne reçois pas mon code"))
print(predict_comment("accident voiture"))

# =========================
# 6. Sauvegarde modèles
# =========================

joblib.dump(model_reclamation, MODELS_DIR / "model_reclamation.pkl")
joblib.dump(model_category, MODELS_DIR / "model_category.pkl")
joblib.dump(vectorizer, MODELS_DIR / "vectorizer_reclamation.pkl")
joblib.dump(vectorizer_cat, MODELS_DIR / "vectorizer_category.pkl")
joblib.dump(model_urgency, MODELS_DIR / "model_urgency.pkl")
joblib.dump(vectorizer_urg, MODELS_DIR / "vectorizer_urgency.pkl")

print("Modèles et vectorizers sauvegardés avec succès.")