import requests
import json

# Test-Benutzer erstellen
def create_test_user():
    url = "http://localhost:8080/register"
    data = {
        "username": "admin",
        "email": "admin@example.com", 
        "password": "admin123",
        "is_developer": True
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            print("✅ Test-Benutzer 'admin' erfolgreich erstellt!")
            print("Credentials: admin / admin123")
            print("Rolle: Entwickler")
        else:
            print(f"❌ Fehler beim Erstellen: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Verbindungsfehler: {e}")

def test_login():
    url = "http://localhost:8080/login"
    data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(url, data=data)
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Login erfolgreich!")
            print(f"Token: {token_data['access_token'][:50]}...")
            return token_data['access_token']
        else:
            print(f"❌ Login fehlgeschlagen: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Login-Fehler: {e}")
    return None

if __name__ == "__main__":
    print("=== Backend Test ===")
    create_test_user()
    print("\n=== Login Test ===")
    token = test_login()
    
    if token:
        print("\n=== Profil Test ===")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://localhost:8080/users/me/", headers=headers)
        if response.ok:
            user_data = response.json()
            print("✅ Profil-Abruf erfolgreich!")
            print(f"Benutzer: {user_data}")
        else:
            print("❌ Profil-Abruf fehlgeschlagen")