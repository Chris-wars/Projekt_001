import React from 'react';

export default function About() {
  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-red-300 mb-4">Über Indie Hub</h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            Eine Plattform von Entwicklern, für Entwickler – und alle, die einzigartige Spiele lieben.
          </p>
        </div>

        {/* Vision Section */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center">
            <span className="text-3xl mr-3">🎮</span>
            Unsere Vision
          </h2>
          <p className="text-gray-200 text-lg leading-relaxed mb-4">
            Indie-Spiele sind das Herzstück der Gaming-Innovation. Hier entstehen die mutigsten Ideen, 
            die kreativsten Konzepte und die persönlichsten Geschichten. Doch viele dieser Perlen 
            gehen in der Masse der großen Plattformen unter.
          </p>
          <p className="text-gray-200 text-lg leading-relaxed">
            <strong className="text-red-300">Indie Hub</strong> wurde geschaffen, um genau das zu ändern. 
            Wir bieten Indie-Entwicklern eine Bühne, auf der ihre Spiele die Aufmerksamkeit bekommen, 
            die sie verdienen.
          </p>
        </div>

        {/* Why Section */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center">
            <span className="text-3xl mr-3">💡</span>
            Warum Indie Hub?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-red-300 mb-3">Für Entwickler</h3>
              <ul className="text-gray-200 space-y-2">
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  Faire Umsatzbeteiligung ohne versteckte Kosten
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  Direkter Kontakt zur Community
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  Tools zur Spieleentwicklung und Vermarktung
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  Unterstützung von der Idee bis zum Launch
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-red-300 mb-3">Für Spieler</h3>
              <ul className="text-gray-200 space-y-2">
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  Kuratierte Auswahl qualitativ hochwertiger Indie-Spiele
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  Frühzugang zu innovativen Spielkonzepten
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  Persönliche Empfehlungen basierend auf Ihren Vorlieben
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  Direkte Unterstützung von Indie-Entwicklern
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center">
            <span className="text-3xl mr-3">🚀</span>
            Unsere Mission
          </h2>
          <p className="text-gray-200 text-lg leading-relaxed mb-4">
            Wir glauben daran, dass jeder Entwickler – egal ob Einzelperson oder kleines Team – 
            die Chance verdient, seine Spiele einem begeisterten Publikum zu präsentieren.
          </p>
          <p className="text-gray-200 text-lg leading-relaxed">
            Indie Hub ist mehr als nur eine Verkaufsplattform. Wir sind eine Community, 
            die Kreativität fördert, Innovationen unterstützt und die Vielfalt des Gamings feiert.
          </p>
        </div>

        {/* Values Section */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-bold text-red-400 mb-6 flex items-center">
            <span className="text-3xl mr-3">⭐</span>
            Unsere Werte
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🤝</div>
              <h3 className="text-lg font-semibold text-red-300 mb-2">Gemeinschaft</h3>
              <p className="text-gray-300 text-sm">
                Wir fördern den Austausch zwischen Entwicklern und Spielern
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-lg font-semibold text-red-300 mb-2">Kreativität</h3>
              <p className="text-gray-300 text-sm">
                Jede innovative Idee verdient eine Chance auf Erfolg
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📈</div>
              <h3 className="text-lg font-semibold text-red-300 mb-2">Wachstum</h3>
              <p className="text-gray-300 text-sm">
                Wir unterstützen Entwickler bei jedem Schritt ihrer Reise
              </p>
            </div>
          </div>
        </div>

        {/* Personal Touch */}
        <div className="bg-gray-900 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center">
            <span className="text-3xl mr-3">👨‍💻</span>
            Warum ich das mache
          </h2>
          <p className="text-gray-200 text-lg leading-relaxed mb-4">
            Als leidenschaftlicher Gamer und Entwickler habe ich selbst erlebt, wie schwer es ist, 
            in der überfüllten Gaming-Landschaft aufzufallen. Zu viele brillante Spiele bleiben 
            unentdeckt, weil sie nicht die Reichweite der großen Studios haben.
          </p>
          <p className="text-gray-200 text-lg leading-relaxed mb-4">
            Ich möchte eine Plattform schaffen, die nicht nur Spiele verkauft, sondern Geschichten erzählt – 
            die Geschichten der Entwickler, ihre Leidenschaft und ihre Vision. Ein Ort, wo Qualität 
            und Kreativität wichtiger sind als Marketingbudgets.
          </p>
          <div className="bg-red-900 bg-opacity-30 rounded-lg p-4 border-l-4 border-red-400">
            <p className="text-gray-200 italic">
              "Indie Hub ist mein Beitrag dazu, das Gaming vielfältiger, persönlicher und 
              aufregender zu machen. Hier geht es um die Spiele, die das Medium voranbringen – 
              ein Spiel nach dem anderen."
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 py-8">
          <h2 className="text-2xl font-bold text-red-300 mb-4">Werden Sie Teil unserer Community</h2>
          <p className="text-gray-300 mb-6">
            Ob Entwickler oder Spieler – gemeinsam gestalten wir die Zukunft des Indie-Gamings.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition">
              Als Entwickler beitreten
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition">
              Spiele entdecken
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
