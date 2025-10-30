// Frontend Debugging Script
// Füge das in die Browser-Konsole ein um das Problem zu diagnostizieren

console.log('🐛 Frontend Debugging gestartet');

// 1. Prüfe localStorage
const token = localStorage.getItem('token');
console.log('Token im localStorage:', !!token, token ? token.substring(0, 20) + '...' : 'KEIN TOKEN');

// 2. Prüfe React State (falls verfügbar)
if (window.React) {
    console.log('React verfügbar');
} else {
    console.log('React nicht verfügbar');
}

// 3. Test API Call
async function testWishlistAPI() {
    console.log('🧪 Teste Wunschliste API...');
    
    if (!token) {
        console.error('❌ Kein Token verfügbar');
        return;
    }
    
    try {
        // Test User Info
        const userResponse = await fetch('http://localhost:8000/users/me/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userResponse.ok) {
            const user = await userResponse.json();
            console.log('✅ User Info:', user);
            
            // Test Wunschliste laden
            const wishlistResponse = await fetch('http://localhost:8000/wishlist/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (wishlistResponse.ok) {
                const wishlist = await wishlistResponse.json();
                console.log('✅ Wunschliste:', wishlist);
                
                // Test Spiel hinzufügen (Game ID 2)
                const addResponse = await fetch('http://localhost:8000/wishlist/2', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log('🔧 Hinzufügen Status:', addResponse.status);
                if (addResponse.ok) {
                    const result = await addResponse.json();
                    console.log('✅ Hinzufügen erfolgreich:', result);
                } else {
                    const error = await addResponse.text();
                    console.log('❌ Hinzufügen Fehler:', error);
                }
            } else {
                console.error('❌ Wunschliste laden fehlgeschlagen:', wishlistResponse.status);
            }
        } else {
            console.error('❌ User Info fehlgeschlagen:', userResponse.status);
        }
    } catch (error) {
        console.error('❌ API Test Fehler:', error);
    }
}

// 4. Prüfe Button Clicks
function findWishlistButtons() {
    const buttons = Array.from(document.querySelectorAll('button'));
    const wishlistButtons = buttons.filter(btn => 
        btn.textContent.includes('Wunschliste') || 
        btn.textContent.includes('💜') ||
        btn.title?.includes('Wunschliste')
    );
    
    console.log('🔍 Wunschliste Buttons gefunden:', wishlistButtons.length);
    wishlistButtons.forEach((btn, index) => {
        console.log(`  ${index + 1}. "${btn.textContent.trim()}" (${btn.title || 'kein title'})`);
    });
    
    return wishlistButtons;
}

// Starte Tests
testWishlistAPI();
findWishlistButtons();

console.log('🔧 Debug Funktionen verfügbar:');
console.log('  - testWishlistAPI() - Teste Backend API');
console.log('  - findWishlistButtons() - Finde Wunschliste Buttons');