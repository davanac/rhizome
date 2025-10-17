/**
 * Page: AdminProjects
 * Description: Admin page for managing projects. Displays all projects with ability to view details and toggle visibility.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Eye, ToggleLeft, ToggleRight, Shield, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/hooks/useSession";
import { getAllProjects, getProjectById, toggleProjectVisibility } from "@/api/admin";

const AdminProjects = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate("/");
      return;
    }
    loadProjects();
  }, [user, navigate]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await getAllProjects();
      if (response.data && response.data.success) {
        setProjects(response.data.data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les projets",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des projets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = async (projectId) => {
    try {
      const response = await getProjectById(projectId);
      if (response.data && response.data.success) {
        setSelectedProject(response.data.data);
        setShowProjectDetails(true);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails du projet",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des détails",
        variant: "destructive",
      });
    }
  };

  const handleToggleVisibility = async (projectId) => {
    setActionLoading(projectId);
    try {
      const response = await toggleProjectVisibility(projectId);
      if (response.data && response.data.success) {
        setProjects(projects.map(project => 
          project.id === projectId 
            ? { ...project, is_visible: response.data.data.is_visible }
            : project
        ));
        toast({
          title: "Succès",
          description: response.data.message || "Visibilité du projet modifiée",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de modifier la visibilité",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification de la visibilité",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.creator_username && project.creator_username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (statusId) => {
    const statusMap = {
      1: { label: "Brouillon", variant: "secondary" },
      2: { label: "En cours", variant: "default" },
      3: { label: "Gelé", variant: "destructive" },
      4: { label: "Terminé", variant: "default" }
    };
    const status = statusMap[statusId] || { label: "Inconnu", variant: "secondary" };
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Gestion des projets</h1>
        </div>
        <Button onClick={loadProjects} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par titre ou créateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Projects count */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <FolderOpen className="h-4 w-4" />
        <span>{filteredProjects.length} projet(s) trouvé(s)</span>
      </div>

      {/* Projects table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des projets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun projet trouvé
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <FolderOpen className="h-8 w-8 text-gray-400" />
                    <div>
                      <div className="font-medium">{project.title}</div>
                      <div className="text-sm text-gray-500">
                        {project.creator_username ? `Par @${project.creator_username}` : "Créateur inconnu"}
                      </div>
                      <div className="text-sm text-gray-500">
                        Créé le {formatDate(project.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(project.status_id)}
                    <Badge variant={project.is_visible ? "default" : "destructive"}>
                      {project.is_visible ? "Visible" : "Masqué"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleProjectClick(project.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVisibility(project.id)}
                      disabled={actionLoading === project.id}
                    >
                      {actionLoading === project.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : project.is_visible ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-red-600" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Details Modal */}
      {showProjectDetails && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Détails du projet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>Titre:</strong> {selectedProject.title}
                </div>
                <div>
                  <strong>Description:</strong>
                  <div className="mt-1 p-2 bg-gray-50 rounded max-h-32 overflow-y-auto">
                    {selectedProject.description || "Aucune description"}
                  </div>
                </div>
                <div>
                  <strong>Créateur:</strong> {selectedProject.creator_username ? `@${selectedProject.creator_username}` : "Inconnu"}
                </div>
                <div>
                  <strong>Statut:</strong> {getStatusBadge(selectedProject.status_id)}
                </div>
                <div>
                  <strong>Visibilité:</strong>{" "}
                  <Badge variant={selectedProject.is_visible ? "default" : "destructive"}>
                    {selectedProject.is_visible ? "Visible" : "Masqué"}
                  </Badge>
                </div>
                <div>
                  <strong>Date de création:</strong> {formatDate(selectedProject.created_at)}
                </div>
                {selectedProject.due_date && (
                  <div>
                    <strong>Date d'échéance:</strong> {formatDate(selectedProject.due_date)}
                  </div>
                )}
                {selectedProject.category && (
                  <div>
                    <strong>Catégorie:</strong> {selectedProject.category}
                  </div>
                )}
                {selectedProject.client && (
                  <div>
                    <strong>Client:</strong> {selectedProject.client}
                  </div>
                )}
                {selectedProject.participant_count && (
                  <div>
                    <strong>Nombre de participants:</strong> {selectedProject.participant_count}
                  </div>
                )}
                {selectedProject.creator_bio && (
                  <div>
                    <strong>Bio du créateur:</strong>
                    <div className="mt-1 p-2 bg-gray-50 rounded">
                      {selectedProject.creator_bio}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setShowProjectDetails(false)}>
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;