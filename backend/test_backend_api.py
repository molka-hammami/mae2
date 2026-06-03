import time
import requests


BASE_URL = "http://127.0.0.1:8000/api"

LOGIN_DATA = {
    "email": "admin@mae.tn",
    "password": "Admin-123",
}

TEST_USER_EMAIL = f"test.agent.{int(time.time())}@mae.tn"


def show_response(title, response, expected_status=200):
    print(f"\n=== {title} ===")
    print("Status code :", response.status_code)

    if response.status_code == expected_status:
        print("Resultat du test : SUCCESS")
    else:
        print("Resultat du test : FAILED")
        print("Status attendu :", expected_status)

    if not response.text:
        return None

    try:
        data = response.json()
    except Exception:
        print("Response :", response.text)
        return None

    if isinstance(data, list):
        print("Response :", f"{len(data)} elements")
    else:
        print("Response :", data)

    return data


def test_login():
    response = requests.post(f"{BASE_URL}/login/", json=LOGIN_DATA)
    data = show_response("Test login valide", response, expected_status=200)

    if response.status_code == 200 and isinstance(data, dict):
        return data.get("access"), data.get("user")

    return None, None


def test_bad_login():
    response = requests.post(
        f"{BASE_URL}/login/",
        json={"email": LOGIN_DATA["email"], "password": "wrong-password"},
    )
    show_response("Test login invalide", response, expected_status=401)


def test_get_reclamations(headers):
    response = requests.get(f"{BASE_URL}/reclamations/", headers=headers)
    data = show_response("Test liste des reclamations", response, expected_status=200)

    if isinstance(data, list) and data:
        return data[0]["id"]

    return None


def test_reclamation_detail(headers, reclamation_id, user):
    params = {
        "role": user.get("role", "ADMIN"),
        "actor_name": user.get("name", "Admin"),
    }

    response = requests.get(
        f"{BASE_URL}/reclamations/{reclamation_id}/",
        headers=headers,
        params=params,
    )
    show_response("Test detail reclamation", response, expected_status=200)


def test_internal_note(headers, reclamation_id):
    payload = {
        "internal_note": "Note interne ajoutee par le script de test.",
        "actor_name": "Test Agent",
        "actor_role": "AGENT",
    }

    response = requests.patch(
        f"{BASE_URL}/reclamations/{reclamation_id}/internal-note/",
        headers=headers,
        json=payload,
    )
    show_response("Test ajout note interne", response, expected_status=200)


def test_admin_note(headers, reclamation_id):
    payload = {
        "admin_note": "Note admin ajoutee par le script de test.",
        "actor_name": "Admin",
        "actor_role": "ADMIN",
    }

    response = requests.patch(
        f"{BASE_URL}/reclamations/{reclamation_id}/admin-note/",
        headers=headers,
        json=payload,
    )
    show_response("Test ajout note admin", response, expected_status=200)


def test_classify_reclamation(headers, reclamation_id):
    payload = {
        "category": "SERVICE CLIENT",
        "actor_name": "Admin",
        "actor_role": "ADMIN",
    }

    response = requests.patch(
        f"{BASE_URL}/reclamations/{reclamation_id}/classify/",
        headers=headers,
        json=payload,
    )
    show_response("Test classification manuelle", response, expected_status=200)


def test_mark_processed(headers, reclamation_id):
    payload = {
        "actor_name": "Test Agent",
        "actor_role": "AGENT",
    }

    response = requests.patch(
        f"{BASE_URL}/reclamations/{reclamation_id}/mark-processed/",
        headers=headers,
        json=payload,
    )
    show_response("Test marquer comme traitee", response, expected_status=200)


def test_feedback_stats(headers):
    response = requests.get(f"{BASE_URL}/feedback-stats/", headers=headers)
    show_response("Test statistiques feedback", response, expected_status=200)


def test_get_users(headers):
    response = requests.get(f"{BASE_URL}/users/", headers=headers)
    show_response("Test liste des utilisateurs", response, expected_status=200)


def test_create_user(headers):
    payload = {
        "name": "Agent Test",
        "email": TEST_USER_EMAIL,
        "personal_email": "",
        "password": "Test-123",
        "role": "AGENT",
        "assigned_category": "SERVICE CLIENT",
        "is_active": True,
    }

    response = requests.post(f"{BASE_URL}/users/", headers=headers, json=payload)
    data = show_response("Test creation utilisateur", response, expected_status=201)

    if response.status_code == 201 and isinstance(data, dict):
        return data.get("id")

    return None


def test_update_user(headers, user_id):
    payload = {
        "name": "Agent Test Modifie",
        "assigned_category": "SINISTRE AUTO",
        "is_active": True,
    }

    response = requests.patch(f"{BASE_URL}/users/{user_id}/", headers=headers, json=payload)
    show_response("Test modification utilisateur", response, expected_status=200)


def test_delete_user(headers, user_id):
    response = requests.delete(f"{BASE_URL}/users/{user_id}/", headers=headers)
    show_response("Test suppression utilisateur", response, expected_status=204)


def main():
    print("Tests des API backend Django")
    print("Assure-toi que le serveur Django est lance sur http://127.0.0.1:8000")

    token, user = test_login()
    test_bad_login()

    headers = {"Content-Type": "application/json"}

    if token:
        headers["Authorization"] = f"Bearer {token}"

    reclamation_id = test_get_reclamations(headers)
    test_feedback_stats(headers)
    test_get_users(headers)

    if reclamation_id:
        test_reclamation_detail(headers, reclamation_id, user or {})
        test_internal_note(headers, reclamation_id)
        test_admin_note(headers, reclamation_id)
        test_classify_reclamation(headers, reclamation_id)
        test_mark_processed(headers, reclamation_id)
    else:
        print("\nAucune reclamation disponible pour tester detail, notes, classification et traitement.")

    test_user_id = test_create_user(headers)

    if test_user_id:
        test_update_user(headers, test_user_id)
        test_delete_user(headers, test_user_id)
    else:
        print("\nUtilisateur de test non cree, modification/suppression ignorees.")


if __name__ == "__main__":
    main()
