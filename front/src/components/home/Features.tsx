import React from 'react';
import { Shield, Users, BookOpen, Globe } from "lucide-react";

export const Features = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900">
          Notre Vision
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-primary" />}
            title="Transparence Absolue"
            description="Certification immuable sur la blockchain de chaque contribution professionnelle"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-primary" />}
            title="Confiance Décentralisée"
            description="Système sophistiqué de validation multi-parties et réputation basée sur les $DAVANAC"
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8 text-primary" />}
            title="Reconnaissance Méritocratique"
            description="NFTs non-cessibles comme preuves tangibles de contribution"
          />
          <FeatureCard
            icon={<Globe className="w-8 h-8 text-primary" />}
            title="Innovation Technologique"
            description="Infrastructure blockchain Polygon et stockage décentralisé IPFS"
          />
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="p-6 text-center">
    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);