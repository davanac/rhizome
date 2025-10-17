import React from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '@/components/home/Hero';

const About = () => {
  return (
    <div>
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto prose prose-lg">
          <h1 className="text-4xl font-bold mb-8">Manifeste Rhizome Protocol</h1>
          
        <h2 className="text-2xl font-semibold mt-8 mb-4">Notre Mission</h2>
        <p>
          Nous bâtissons un écosystème transparent et décentralisé où chaque contribution professionnelle est immortalisée et validée sur la blockchain. Notre plateforme repose sur des principes fondamentaux de certification immuable, de validation par les pairs et de reconnaissance tangible des compétences à travers des NFTs.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Nos Valeurs Fondamentales</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">1. Transparence Absolue</h3>
        <p>
          La transparence est l'ADN de Rhizome Protocol. Chaque contribution est certifiée de manière immuable sur la blockchain, créant un historique complet et vérifiable des projets. Notre processus de validation transparent et notre documentation publique garantissent une intégrité totale du système.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">2. Confiance Décentralisée</h3>
        <p>La confiance se construit à travers un système sophistiqué de validation multi-parties. Notre architecture intègre :</p>
        <ul>
          <li>Une certification client native</li>
          <li>Un système de réputation basé sur les $DAVANAC</li>
          <li>Une vérification d'identité sécurisée</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">3. Reconnaissance Méritocratique</h3>
        <p>Nous valorisons l'excellence professionnelle à travers :</p>
        <ul>
          <li>Des NFTs non-cessibles comme preuves tangibles de contribution</li>
          <li>Un système de niveaux DAVANAC évolutif</li>
          <li>Un portfolio professionnel vérifié et immuable</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">4. Collaboration Synergique</h3>
        <ul>
          <li>Promotion active du travail d'équipe</li>
          <li>Système de validation par les pairs</li>
          <li>Partage dynamique des connaissances</li>
          <li>Animation d'une communauté vivante</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">5. Innovation Technologique</h3>
        <ul>
          <li>La blockchain Polygon pour des transactions rapides et économiques</li>
          <li>Le stockage décentralisé IPFS pour la pérennité des données</li>
          <li>Des smart contracts évolutifs</li>
          <li>Une interface utilisateur intuitive</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Infrastructure Technologique</h2>
        <p>Notre plateforme s'appuie sur des technologies décentralisées de pointe :</p>
        <ul>
          <li>Blockchain Polygon : Garantissant rapidité et efficacité</li>
          <li>Smart Contracts : Assurant une logique métier transparente</li>
          <li>IPFS : Offrant un stockage décentralisé permanent</li>
          <li>NFTs : Certifiant l'unicité des contributions</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Impact Transformateur</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">Renforcement de la Confiance Professionnelle</h3>
        <ul>
          <li>Élimination des fausses déclarations</li>
          <li>Certification vérifiable des contributions</li>
          <li>Validation multi-parties</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">Valorisation des Talents</h3>
        <ul>
          <li>Reconnaissance tangible des compétences</li>
          <li>Portfolio professionnel certifié</li>
          <li>Historique immuable des contributions</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">Optimisation de la Collaboration</h3>
        <ul>
          <li>Processus de validation transparent</li>
          <li>Attribution équitable des contributions</li>
          <li>Documentation structurée des rôles</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">Innovation en Gestion de Réputation</h3>
        <ul>
          <li>Économie de tokens $DAVANAC</li>
          <li>NFTs comme certificats de contribution</li>
          <li>Système de reconnaissance évolutif</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Appel à l'Action</h2>
        <p>
          Rejoignez-nous dans cette révolution de la certification professionnelle. Ensemble, construisons un écosystème où la confiance, la reconnaissance et la collaboration définissent chaque interaction professionnelle. Rhizome Protocol n'est pas simplement une plateforme – c'est l'avenir de la validation professionnelle décentralisée.
        </p>

        <div className="mt-8 mb-12">
          <Link 
            to="/signup"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Commencer maintenant →
          </Link>
        </div>

        <hr className="my-8" />

        <p className="text-center italic">Construisons ensemble l'avenir de la certification professionnelle.</p>
        </div>
      </div>
    </div>
  );
};

export default About;
