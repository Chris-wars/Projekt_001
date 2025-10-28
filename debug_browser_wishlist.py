#!/usr/bin/env python3
"""
Debug Script für Wunschliste im Browser
Simuliert die Frontend-Aktionen Schritt für Schritt
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def debug_browser_wishlist():
    """Simuliert die Browser-Wunschliste-Interaktion"""
    
    print("🔍 Debug: Wunschliste im Browser...")
    
    # 1. Simuliere User Login
    print("\n1. Simuliere Benutzer-Login...")
    login_data = {
        "username": "test_role_user",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access_token')
            headers = {"Authorization": f"Bearer {access_token}"}
            print(f"✅ Login erfolgreich - Token: {access_token[:20]}...")
        else:
            print(f"❌ Login fehlgeschlagen: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Login Error: {e}")
        return False
    
    # 2. Lade Spiele (wie im Frontend)
    print("\n2. Lade Spiele (wie im Frontend)...")
    try:
        response = requests.get(f"{BASE_URL}/games/")
        if response.status_code == 200:
            games = response.json()
            print(f"✅ {len(games)} Spiele geladen")
            for game in games:
                print(f"   - {game['title']} (ID: {game['id']}, Published: {game.get('is_published')})")
            
            if len(games) == 0:
                print("❌ Keine Spiele verfügbar!")
                return False
                
            test_game = games[0]
        else:
            print(f"❌ Spiele laden fehlgeschlagen: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Spiele laden Error: {e}")
        return False
    
    # 3. Prüfe aktuelle Wunschliste (Initial-Load wie im Frontend)
    print("\n3. Lade initiale Wunschliste...")
    try:
        response = requests.get(f"{BASE_URL}/wishlist/", headers=headers)  
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            wishlist = response.json()
            print(f"✅ Aktuelle Wunschliste: {len(wishlist)} Spiele")
            current_wishlist_ids = [game['id'] for game in wishlist]
            print(f"   IDs in Wunschliste: {current_wishlist_ids}")
        else:
            print(f"❌ Wunschliste laden fehlgeschlagen: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Wunschliste laden Error: {e}")
        return False
    
    # 4. Simuliere Button-Click "Zur Wunschliste"
    print(f"\n4. Simuliere Button-Click 'Zur Wunschliste' für '{test_game['title']}'...")
    try:
        game_id = test_game['id']
        
        # Genau wie im Frontend
        response = requests.post(f"{BASE_URL}/wishlist/{game_id}", headers=headers)
        print(f"POST Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result.get('message')}")
            
            # Simuliere Frontend State Update
            print("✅ Frontend würde jetzt Wunschliste-Set aktualisieren")
            
        elif response.status_code == 400:
            error_data = response.json()
            print(f"ℹ️  {error_data.get('detail')}")
        else:
            print(f"❌ Hinzufügen fehlgeschlagen: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Button-Click Error: {e}")
        return False
    
    # 5. Verifikation - Lade Wunschliste erneut
    print("\n5. Verifikation - Lade Wunschliste nach Hinzufügen...")
    try:
        response = requests.get(f"{BASE_URL}/wishlist/", headers=headers)
        if response.status_code == 200:
            updated_wishlist = response.json()
            print(f"✅ Aktualisierte Wunschliste: {len(updated_wishlist)} Spiele")
            
            for game in updated_wishlist:
                print(f"   - {game['title']} (ID: {game['id']})")
            
            # Prüfe, ob das Test-Spiel dabei ist
            is_in_wishlist = any(game['id'] == game_id for game in updated_wishlist)
            if is_in_wishlist:
                print(f"✅ '{test_game['title']}' ist jetzt in der Wunschliste!")
                return True
            else:
                print(f"❌ '{test_game['title']}' ist NICHT in der Wunschliste!")
                return False
                
        else:
            print(f"❌ Verifikation fehlgeschlagen: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Verifikation Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starte Browser-Wunschliste Debug\n")
    
    success = debug_browser_wishlist()
    
    if success:
        print("\n🎉 Browser-Simulation erfolgreich!")
        print("✅ Das Problem liegt wahrscheinlich im Frontend-Code oder Browser")
    else:
        print("\n❌ Browser-Simulation fehlgeschlagen!")
        print("❌ Das Problem liegt im Backend oder der API-Kommunikation")