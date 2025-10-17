import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface ProjectErrorProps {
  title: string;
  description: string;
}

export const ProjectError = ({ title, description }: ProjectErrorProps) => (
  <div className="min-h-screen bg-gray-50">
    <div className="container py-8">
      <Link to="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux Projets
        </Button>
      </Link>
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {title}
        </h2>
        <p className="text-gray-600 text-lg">
          {description}
        </p>
        <div className="mt-8">
          <Link to="/">
            <Button>
              Voir tous les projets
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </div>
);