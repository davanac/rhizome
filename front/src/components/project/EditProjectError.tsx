import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EditProjectErrorProps {
  title: string;
  description: string;
}

export const EditProjectError = ({ title, description }: EditProjectErrorProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{description}</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};