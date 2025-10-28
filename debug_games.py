import requests
import json

# Teste verfügbare Spiele
response = requests.get('http://localhost:8000/games/')
games = response.json()

print("Verfügbare Spiele:")
for game in games:
    print(f"  - {game['title']} (ID: {game['id']}) - Published: {game.get('is_published', 'unknown')}")

# Teste API-Endpunkte
print("\nTeste Wunschliste-API ohne Token:")
try:
    response = requests.get('http://localhost:8000/wishlist/')
    print(f"GET /wishlist/ -> Status: {response.status_code}")
    if response.status_code != 200:
        print(f"  Error: {response.text}")
except Exception as e:
    print(f"  Exception: {e}")