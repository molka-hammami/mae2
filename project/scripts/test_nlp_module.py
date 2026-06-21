from api import predict_comment_hybrid, should_use_judge
from judge import judge_prediction


TEST_CASES = [
    {
        "comment": "Je suis tres mecontent du service, personne ne repond a mes emails.",
        "expected_is_reclamation": "reclamation",
    },
    {
        "comment": "Merci pour votre excellent service.",
        "expected_is_reclamation": "non_reclamation",
    },
    {
        "comment": "J'ai eu un accident voiture et mon dossier est bloque.",
        "expected_is_reclamation": "reclamation",
    },
    {
        "comment": "Je veux connaitre le prix de l'assurance auto.",
        "expected_is_reclamation": "reclamation",
    },
    {
        "comment": "Mon dossier est en attente depuis longtemps et je n'ai aucune reponse.",
        "expected_is_reclamation": "reclamation",
    },
]


def run_test(test_case):
    comment = test_case["comment"]
    expected_is_reclamation = test_case["expected_is_reclamation"]

    prediction = predict_comment_hybrid(comment)
    judge_result = {"verdict": "skipped", "reason": "Judge non necessaire"}
    final_result = prediction

    if should_use_judge(prediction):
        judge_result = judge_prediction(comment, prediction)
        final_result = judge_result.get("corrected_prediction", prediction)

    success = final_result.get("is_reclamation") == expected_is_reclamation

    return {
        "comment": comment,
        "expected_is_reclamation": expected_is_reclamation,
        "prediction": prediction,
        "judge": judge_result,
        "final_result": final_result,
        "status": "SUCCESS" if success else "FAILED",
    }


def main():
    print("=== TEST DU MODULE NLP ===")

    for index, test_case in enumerate(TEST_CASES, start=1):
        result = run_test(test_case)

        print(f"\nTest {index}")
        print(f"Commentaire : {result['comment']}")
        print(f"Resultat attendu : {result['expected_is_reclamation']}")
        print(f"Prediction initiale : {result['prediction']}")
        print(f"Judge : {result['judge']}")
        print(f"Resultat final : {result['final_result']}")
        print(f"Statut du test : {result['status']}")


if __name__ == "__main__":
    main()
