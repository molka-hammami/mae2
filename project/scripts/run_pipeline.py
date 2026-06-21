import subprocess
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = BASE_DIR / "scripts"
FACEBOOK_DIR = BASE_DIR / "data" / "facebook"
LINKEDIN_DIR = BASE_DIR / "data" / "linkedin"
LOGS_DIR = BASE_DIR / "logs"

LOGS_DIR.mkdir(exist_ok=True)

log_file = LOGS_DIR / f"pipeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

steps = [
    {
        "name": "Scraping Facebook",
        "cmd": ["python", "app.py"],
        "cwd": str(FACEBOOK_DIR)
    },
    {
        "name": "Scraping LinkedIn",
        "cmd": ["python", "mon_scraper.py"],
        "cwd": str(LINKEDIN_DIR)
    },
    {
        "name": "Extraction commentaires",
        "cmd": ["python", str(SCRIPTS_DIR / "extract_comments.py")]
    },
    {
        "name": "Cleaning commentaires",
        "cmd": ["python", str(SCRIPTS_DIR / "preprocessing.py")]
    },
    {
        "name": "Chargement PostgreSQL",
        "cmd": ["python", str(SCRIPTS_DIR / "load_comments_to_postgres.py")]
    },
    {
        "name": "Prediction via API",
        "cmd": ["python", str(SCRIPTS_DIR / "predict_with_api.py")]
    }
]

def main():
    with open(log_file, "w", encoding="utf-8") as log:
        log.write(f"Début pipeline : {datetime.now()}\n\n")

        for step in steps:
            name = step["name"]
            cmd = step["cmd"]

            print(f"--- {name} ---")
            log.write(f"--- {name} ---\n")
            log.write(f"Commande : {' '.join(cmd)}\n")

            result = subprocess.run(
                step["cmd"],
                cwd=step.get("cwd"),
                capture_output=True,
                text=True
            )

            log.write("STDOUT:\n")
            log.write(result.stdout + "\n")
            log.write("STDERR:\n")
            log.write(result.stderr + "\n")

            if result.returncode != 0:
                log.write(f"ERREUR dans l'étape : {name}\n")
                print(f"ERREUR dans l'étape : {name}")
                print(f"Voir log : {log_file}")
                return

        log.write(f"\nFin pipeline : {datetime.now()}\n")

    print("Pipeline terminé avec succès.")
    print(f"Log enregistré dans : {log_file}")

if __name__ == "__main__":
    main()