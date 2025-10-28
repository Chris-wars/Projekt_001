#!/usr/bin/env python3
"""
Test Script für User Role Change Funktionalität
Überprüft, ob die Benutzerrolle-Änderung korrekt funktioniert
"""

import requests
import json
import sys

# API Base URL
BASE_URL = "http://localhost:8000"

def test_role_change():
    """Testet die Benutzerrolle-Änderung"""
    
    print("🔧 Teste Benutzerrolle-Änderung...")
    
    # 1. Teste Backend Health
    print("\n1. Backend Health Check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend ist erreichbar")
            health_data = response.json()
            print(f"   Service: {health_data.get('service')}")
            print(f"   Version: {health_data.get('version')}")
        else:
            print(f"❌ Backend nicht erreichbar: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend Connection Error: {e}")
        return False
    
    # 2. Erstelle Test-User
    print("\n2. Erstelle Test-User...")
    test_user_data = {
        "username": "test_role_user",
        "email": "test_role@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register", json=test_user_data)
        if response.status_code in [200, 201]:
            print("✅ Test-User erstellt")
            user_data = response.json()
            print(f"   User ID: {user_data.get('id')}")
            print(f"   Username: {user_data.get('username')}")
            print(f"   Is Developer: {user_data.get('is_developer')}")
        elif response.status_code == 400:
            print("⚠️  Test-User existiert bereits, versuche Login...")
        else:
            print(f"❌ User Creation Failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ User Creation Error: {e}")
    
    # 3. Login Test-User
    print("\n3. Login Test-User...")
    login_data = {
        "username": test_user_data["username"],
        "password": test_user_data["password"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", data=login_data)
        if response.status_code == 200:
            print("✅ Login erfolgreich")
            token_data = response.json()
            access_token = token_data.get('access_token')
            print(f"   Token erhalten: {access_token[:20]}...")
        else:
            print(f"❌ Login Failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Login Error: {e}")
        return False
    
    # 4. Aktuelles Profil abrufen
    print("\n4. Aktuelles Profil abrufen...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/users/me/", headers=headers)
        if response.status_code == 200:
            print("✅ Profil abgerufen")
            current_profile = response.json()
            print(f"   Username: {current_profile.get('username')}")
            print(f"   Email: {current_profile.get('email')}")
            print(f"   Is Developer: {current_profile.get('is_developer')}")
            print(f"   Is Admin: {current_profile.get('is_admin')}")
        else:
            print(f"❌ Profile Fetch Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Profile Fetch Error: {e}")
        return False
    
    # 5. Role Change Test
    print("\n5. Teste Rolle-Änderung...")
    new_developer_status = not current_profile.get('is_developer', False)
    
    role_update_data = {
        "is_developer": new_developer_status
    }
    
    try:
        response = requests.put(f"{BASE_URL}/users/me/", 
                              json=role_update_data, 
                              headers=headers)
        if response.status_code == 200:
            print("✅ Rolle erfolgreich geändert")
            updated_profile = response.json()
            print(f"   Vorher: is_developer = {current_profile.get('is_developer')}")
            print(f"   Nachher: is_developer = {updated_profile.get('is_developer')}")
            
            if updated_profile.get('is_developer') == new_developer_status:
                print("✅ Rolle-Änderung korrekt persistiert")
                return True
            else:
                print("❌ Rolle-Änderung nicht korrekt persistiert")
                return False
        else:
            print(f"❌ Role Update Failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Role Update Error: {e}")
        return False

def cleanup_test_user():
    """Entfernt den Test-User (optional)"""
    print("\n🧹 Cleanup wird übersprungen (Test-User bleibt für weitere Tests)")

if __name__ == "__main__":
    print("🚀 Starte User Role Change Test\n")
    
    success = test_role_change()
    
    if success:
        print("\n🎉 Alle Tests erfolgreich!")
        print("✅ Die Benutzerrolle-Änderung funktioniert korrekt in Docker")
        sys.exit(0)
    else:
        print("\n❌ Tests fehlgeschlagen!")
        print("❌ Die Benutzerrolle-Änderung funktioniert NICHT korrekt")
        sys.exit(1)