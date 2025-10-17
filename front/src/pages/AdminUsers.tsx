/**
 * Page: AdminUsers
 * Description: Admin page for managing users. Displays all users with ability to view details and toggle enabled status.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserCircle2, Eye, ToggleLeft, ToggleRight, Shield, Users, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/hooks/useSession";
import { getAllUsers, getUserById, toggleUserEnabled } from "@/api/admin";

const AdminUsers = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate("/");
      return;
    }
    loadUsers();
  }, [user, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await getAllUsers();
      if (response.data && response.data.success) {
        setUsers(response.data.data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les utilisateurs",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (userId) => {
    try {
      const response = await getUserById(userId);
      if (response.data && response.data.success) {
        setSelectedUser(response.data.data);
        setShowUserDetails(true);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails de l'utilisateur",
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

  const handleToggleEnabled = async (userId) => {
    setActionLoading(userId);
    try {
      const response = await toggleUserEnabled(userId);
      if (response.data && response.data.success) {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, is_enabled: response.data.data.is_enabled }
            : user
        ));
        toast({
          title: "Succès",
          description: response.data.message || "Statut utilisateur modifié",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de modifier le statut",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du statut",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchableText = (user.verifier_id || user.email || '').toLowerCase();
    return searchableText.includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        </div>
        <Button onClick={loadUsers} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par identifiant ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users count */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <Users className="h-4 w-4" />
        <span>{filteredUsers.length} utilisateur(s) trouvé(s)</span>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun utilisateur trouvé
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <UserCircle2 className="h-8 w-8 text-gray-400" />
                    <div>
                      <div className="font-medium">{user.verifier_id || user.email || 'Identifiant non défini'}</div>
                      <div className="text-sm text-gray-500">
                        Créé le {formatDate(user.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.is_enabled ? "default" : "destructive"}>
                      {user.is_enabled ? "Activé" : "Désactivé"}
                    </Badge>
                    {user.is_admin && (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUserClick(user.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleEnabled(user.id)}
                      disabled={actionLoading === user.id}
                    >
                      {actionLoading === user.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : user.is_enabled ? (
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

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle2 className="h-5 w-5" />
                Détails de l'utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>Identifiant:</strong> {selectedUser.verifier_id || 'Non défini'}
                </div>
                <div>
                  <strong>Email:</strong> {selectedUser.email || 'Email non défini'}
                </div>
                {selectedUser.verifier && (
                  <div>
                    <strong>Fournisseur:</strong> {selectedUser.verifier}
                  </div>
                )}
                {selectedUser.type_of_login && (
                  <div>
                    <strong>Type de connexion:</strong> {selectedUser.type_of_login}
                  </div>
                )}
                <div>
                  <strong>Statut:</strong>{" "}
                  <Badge variant={selectedUser.is_enabled ? "default" : "destructive"}>
                    {selectedUser.is_enabled ? "Activé" : "Désactivé"}
                  </Badge>
                </div>
                <div>
                  <strong>Administrateur:</strong>{" "}
                  <Badge variant={selectedUser.is_admin ? "default" : "secondary"}>
                    {selectedUser.is_admin ? "Oui" : "Non"}
                  </Badge>
                </div>
                <div>
                  <strong>Date de création:</strong> {formatDate(selectedUser.created_at)}
                </div>
                {selectedUser.updated_at && (
                  <div>
                    <strong>Dernière modification:</strong> {formatDate(selectedUser.updated_at)}
                  </div>
                )}
                {selectedUser.profiles && selectedUser.profiles.length > 0 && (
                  <div>
                    <strong>Profils ({selectedUser.profiles.length}):</strong>
                    <div className="mt-2 space-y-2">
                      {selectedUser.profiles.map((profile) => (
                        <div key={profile.id} className="p-2 bg-gray-50 rounded">
                          <div className="font-medium">@{profile.username}</div>
                          <div className="text-sm text-gray-600">{profile.type}</div>
                          {profile.bio && (
                            <div className="text-sm text-gray-500 mt-1">{profile.bio}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setShowUserDetails(false)}>
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

export default AdminUsers;