#!/usr/bin/env python3
"""
Test Script für Wunschliste-Funktionalität
Testet das Hinzufügen und Entfernen von Spielen zur/aus der Wunschliste
"""

import requests
import json
import sys

# API Base URL
BASE_URL = "http://localhost:8000"

def test_wishlist_functionality():
    """Testet die komplette Wunschliste-Funktionalität"""
    
    print("🎮 Teste Wunschliste-Funktionalität...")
    
    # 1. Login Test-User
    print("\n1. Login Test-User...")
    login_data = {
        "username": "test_role_user",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", data=login_data)
        if response.status_code == 200:
            print("✅ Login erfolgreich")
            token_data = response.json()
            access_token = token_data.get('access_token')
            headers = {"Authorization": f"Bearer {access_token}"}
        else:
            print(f"❌ Login fehlgeschlagen: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Login Error: {e}")
        return False
    
    # 2. Verfügbare Spiele abrufen
    print("\n2. Verfügbare Spiele abrufen...")
    try:
        response = requests.get(f"{BASE_URL}/games/")
        if response.status_code == 200:
            games = response.json()
            print(f"✅ {len(games)} Spiele gefunden")
            if len(games) == 0:
                print("⚠️  Keine Spiele verfügbar für Test")
                return False
            test_game = games[0]
            print(f"   Test-Spiel: {test_game.get('title')} (ID: {test_game.get('id')})")
        else:
            print(f"❌ Spiele laden fehlgeschlagen: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Spiele laden Error: {e}")
        return False
    
    # 3. Aktuelle Wunschliste abrufen
    print("\n3. Aktuelle Wunschliste abrufen...")
    try:
        response = requests.get(f"{BASE_URL}/wishlist/", headers=headers)
        if response.status_code == 200:
            wishlist = response.json()
            print(f"✅ Wunschliste hat {len(wishlist)} Spiele")
            initial_count = len(wishlist)
        else:
            print(f"❌ Wunschliste laden fehlgeschlagen: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Wunschliste laden Error: {e}")
        return False
    
    # 4. Spiel zur Wunschliste hinzufügen
    print("\n4. Spiel zur Wunschliste hinzufügen...")
    try:
        game_id = test_game.get('id')
        response = requests.post(f"{BASE_URL}/wishlist/{game_id}", headers=headers)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result.get('message')}")
        elif response.status_code == 400:
            # Spiel ist bereits in der Wunschliste
            error_data = response.json()
            print(f"ℹ️  {error_data.get('detail')}")
        else:
            print(f"❌ Hinzufügen fehlgeschlagen: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Hinzufügen Error: {e}")
        return False
    
    # 5. Wunschliste erneut abrufen (sollte jetzt 1 mehr haben)
    print("\n5. Wunschliste nach Hinzufügen prüfen...")
    try:
        response = requests.get(f"{BASE_URL}/wishlist/", headers=headers)
        if response.status_code == 200:
            wishlist = response.json()
            new_count = len(wishlist)
            print(f"✅ Wunschliste hat jetzt {new_count} Spiele")
            
            # Prüfe, ob das Spiel in der Liste ist
            game_in_wishlist = any(game.get('id') == game_id for game in wishlist)
            if game_in_wishlist:
                print("✅ Test-Spiel ist in der Wunschliste")
            else:
                print("❌ Test-Spiel ist NICHT in der Wunschliste")
                return False
        else:
            print(f"❌ Wunschliste laden fehlgeschlagen: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Wunschliste laden Error: {e}")
        return False
    
    # 6. Wunschliste-Statistiken abrufen
    print("\n6. Wunschliste-Statistiken abrufen...")
    try:
        response = requests.get(f"{BASE_URL}/wishlist/stats", headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Statistiken:")
            print(f"   Gesamte Spiele: {stats.get('total_games')}")
            print(f"   Kostenlose Spiele: {stats.get('free_games')}")
            print(f"   Kostenpflichtige Spiele: {stats.get('paid_games')}")
            print(f"   Gesamtwert: {stats.get('total_value')}€")
        else:
            print(f"❌ Statistiken laden fehlgeschlagen: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Statistiken laden Error: {e}")
        return False
    
    # 7. Spiel aus Wunschliste entfernen
    print("\n7. Spiel aus Wunschliste entfernen...")
    try:
        response = requests.delete(f"{BASE_URL}/wishlist/{game_id}", headers=headers)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result.get('message')}")
        else:
            print(f"❌ Entfernen fehlgeschlagen: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Entfernen Error: {e}")
        return False
    
    # 8. Finale Wunschliste prüfen (sollte wieder ursprüngliche Anzahl haben)
    print("\n8. Finale Wunschliste prüfen...")
    try:
        response = requests.get(f"{BASE_URL}/wishlist/", headers=headers)
        if response.status_code == 200:
            wishlist = response.json()
            final_count = len(wishlist)
            print(f"✅ Wunschliste hat wieder {final_count} Spiele")
            
            # Prüfe, ob das Spiel NICHT mehr in der Liste ist
            game_in_wishlist = any(game.get('id') == game_id for game in wishlist)
            if not game_in_wishlist:
                print("✅ Test-Spiel wurde erfolgreich entfernt")
                return True
            else:
                print("❌ Test-Spiel ist immer noch in der Wunschliste")
                return False
        else:
            print(f"❌ Finale Wunschliste laden fehlgeschlagen: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Finale Wunschliste laden Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starte Wunschliste-Funktionalitäts-Test\n")
    
    success = test_wishlist_functionality()
    
    if success:
        print("\n🎉 Alle Wunschliste-Tests erfolgreich!")
        print("✅ Hinzufügen zur Wunschliste funktioniert")
        print("✅ Entfernen aus der Wunschliste funktioniert")
        print("✅ Wunschliste-Status wird korrekt verwaltet")
        sys.exit(0)
    else:
        print("\n❌ Wunschliste-Tests fehlgeschlagen!")
        sys.exit(1)