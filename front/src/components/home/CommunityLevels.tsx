import React from 'react';

export const CommunityLevels = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900">
          Niveaux d'Expertise
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <LevelCard
            title="DAVANAC Initié"
            range="0-1000 $DAVANAC"
            features={[
              "Accès aux fonctionnalités essentielles",
              "Première immersion dans l'écosystème",
              "Création encadrée de projets"
            ]}
          />
          <LevelCard
            title="DAVANAC Expert"
            range="1001-5000 $DAVANAC"
            features={[
              "Création illimitée de projets",
              "Participation active à la gouvernance",
              "Reconnaissance établie dans l'écosystème"
            ]}
            highlighted
          />
          <LevelCard
            title="DAVANAC Master"
            range="5001+ $DAVANAC"
            features={[
              "Statut d'ambassadeur",
              "Rôle clé dans la gouvernance",
              "Mission de mentorat communautaire"
            ]}
          />
        </div>
      </div>
    </section>
  );
};

const LevelCard = ({ title, range, features, highlighted = false }: { 
  title: string; 
  range: string; 
  features: string[];
  highlighted?: boolean;
}) => (
  <div className={`bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow ${highlighted ? 'border-2 border-primary' : ''}`}>
    <h3 className="text-2xl font-semibold mb-4">{title}</h3>
    <p className="text-gray-600 mb-4">{range}</p>
    <ul className="space-y-2 text-gray-600">
      {features.map((feature, index) => (
        <li key={index}>• {feature}</li>
      ))}
    </ul>
  </div>
);