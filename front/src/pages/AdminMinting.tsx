/**
 * Page: AdminMinting
 * Description: Admin page for managing minting operations. Displays all minting operations with ability to view details, filter by status, and retry failed operations.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Eye,
  RotateCcw,
  Shield,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/hooks/useSession";
import {
  getAllMintingOperations,
  getMintingOperationById,
  retryMintingOperation,
} from "@/api/admin";

interface MintingOperation {
  id: string;
  project_id: string;
  project_title: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  tx_hash: string | null;
  block_number: number | null;
  gas_used: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  next_retry_at: string | null;
}

interface MintingOperationError {
  id: string;
  error_type: string;
  error_code: string | null;
  error_message: string;
  attempt_number: number;
  phase: string;
  created_at: string;
}

interface MintingOperationDetails extends MintingOperation {
  minting_data: unknown;
  errors: MintingOperationError[] | null;
  nft_results: unknown[] | null;
}

const STATUS_OPTIONS = [
  { value: null, label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "claimed", label: "Réclamé" },
  { value: "processing", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "failed", label: "Échoué" },
  { value: "retrying", label: "Nouvelle tentative" },
];

const AdminMinting = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [operations, setOperations] = useState<MintingOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] =
    useState<MintingOperationDetails | null>(null);
  const [showOperationDetails, setShowOperationDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate("/");
      return;
    }
    loadOperations();
  }, [user, navigate]);

  // Reload when status filter changes
  useEffect(() => {
    if (user?.isAdmin) {
      loadOperations();
    }
  }, [statusFilter]);

  const loadOperations = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : undefined;
      const response = await getAllMintingOperations(params);
      if (response.data && response.data.success) {
        setOperations(response.data.data || []);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les opérations de minting",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des opérations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOperationClick = async (operationId: string) => {
    try {
      const response = await getMintingOperationById(operationId);
      if (response.data && response.data.success) {
        setSelectedOperation(response.data.data);
        setShowOperationDetails(true);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails de l'opération",
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

  const handleRetry = async (operationId: string) => {
    setActionLoading(operationId);
    try {
      const response = await retryMintingOperation(operationId);
      if (response.data && response.data.success) {
        // Update the operation in the list
        setOperations(
          operations.map((op) =>
            op.id === operationId
              ? { ...op, status: "pending", attempt_count: 0 }
              : op
          )
        );
        // Update modal if open
        if (selectedOperation?.id === operationId) {
          setSelectedOperation({
            ...selectedOperation,
            status: "pending",
            attempt_count: 0,
          });
        }
        toast({
          title: "Succès",
          description: "Opération relancée avec succès",
        });
      } else {
        toast({
          title: "Erreur",
          description:
            response.data?.message || "Impossible de relancer l'opération",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la relance de l'opération",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Copié dans le presse-papier",
    });
  };

  const filteredOperations = operations.filter((operation) =>
    operation.project_title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateHash = (hash: string | null) => {
    if (!hash) return "-";
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
    > = {
      pending: {
        label: "En attente",
        variant: "secondary",
        icon: <Clock className="h-3 w-3" />,
      },
      claimed: {
        label: "Réclamé",
        variant: "outline",
        icon: <Clock className="h-3 w-3" />,
      },
      processing: {
        label: "En cours",
        variant: "default",
        icon: <RefreshCw className="h-3 w-3 animate-spin" />,
      },
      completed: {
        label: "Terminé",
        variant: "default",
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      failed: {
        label: "Échoué",
        variant: "destructive",
        icon: <AlertTriangle className="h-3 w-3" />,
      },
      retrying: {
        label: "Nouvelle tentative",
        variant: "outline",
        icon: <RotateCcw className="h-3 w-3" />,
      },
    };
    const config = statusConfig[status] || {
      label: status,
      variant: "secondary" as const,
      icon: null,
    };
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getPhaseBadge = (phase: string) => {
    const phaseLabels: Record<string, string> = {
      blockchain_submission: "Soumission blockchain",
      blockchain_confirmation: "Confirmation blockchain",
      nft_fetch: "Récupération NFT",
      db_storage: "Stockage DB",
    };
    return (
      <Badge variant="outline" className="text-xs">
        {phaseLabels[phase] || phase}
      </Badge>
    );
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
          <h1 className="text-2xl font-bold">Gestion du minting</h1>
        </div>
        <Button
          onClick={loadOperations}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Status filter bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value || "all"}
            variant={statusFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par titre de projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Operations count */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <Zap className="h-4 w-4" />
        <span>{filteredOperations.length} opération(s) trouvée(s)</span>
      </div>

      {/* Operations list */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des opérations de minting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOperations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune opération trouvée
              </div>
            ) : (
              filteredOperations.map((operation) => (
                <div
                  key={operation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <Zap className="h-8 w-8 text-yellow-500" />
                    <div>
                      <div className="font-medium">
                        {operation.project_title || "Projet inconnu"}
                      </div>
                      <div className="text-sm text-gray-500">
                        Créé le {formatDate(operation.created_at)}
                      </div>
                      {operation.tx_hash && (
                        <div className="text-sm text-gray-500 font-mono">
                          TX: {truncateHash(operation.tx_hash)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(operation.status)}
                    <Badge variant="outline">
                      {operation.attempt_count}/{operation.max_attempts}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOperationClick(operation.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {operation.status === "failed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetry(operation.id)}
                        disabled={actionLoading === operation.id}
                      >
                        {actionLoading === operation.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4 text-orange-600" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Operation Details Modal */}
      {showOperationDetails && selectedOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Détails de l'opération
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>ID:</strong>
                    <div className="font-mono text-sm flex items-center gap-2">
                      {truncateHash(selectedOperation.id)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedOperation.id)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <strong>Projet:</strong>
                    <div>{selectedOperation.project_title || "Inconnu"}</div>
                  </div>
                  <div>
                    <strong>Statut:</strong>
                    <div className="mt-1">
                      {getStatusBadge(selectedOperation.status)}
                    </div>
                  </div>
                  <div>
                    <strong>Tentatives:</strong>
                    <div>
                      {selectedOperation.attempt_count} /{" "}
                      {selectedOperation.max_attempts}
                    </div>
                  </div>
                  <div>
                    <strong>Créé le:</strong>
                    <div>{formatDate(selectedOperation.created_at)}</div>
                  </div>
                  {selectedOperation.started_at && (
                    <div>
                      <strong>Démarré le:</strong>
                      <div>{formatDate(selectedOperation.started_at)}</div>
                    </div>
                  )}
                  {selectedOperation.completed_at && (
                    <div>
                      <strong>Terminé le:</strong>
                      <div>{formatDate(selectedOperation.completed_at)}</div>
                    </div>
                  )}
                  {selectedOperation.next_retry_at && (
                    <div>
                      <strong>Prochaine tentative:</strong>
                      <div>{formatDate(selectedOperation.next_retry_at)}</div>
                    </div>
                  )}
                </div>

                {/* Blockchain Results */}
                {selectedOperation.tx_hash && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Résultats blockchain
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg">
                      <div>
                        <strong>Transaction Hash:</strong>
                        <div className="font-mono text-sm flex items-center gap-2">
                          {truncateHash(selectedOperation.tx_hash)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(selectedOperation.tx_hash!)
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <a
                            href={`https://sepolia-optimism.etherscan.io/tx/${selectedOperation.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                      {selectedOperation.block_number && (
                        <div>
                          <strong>Block Number:</strong>
                          <div>{selectedOperation.block_number}</div>
                        </div>
                      )}
                      {selectedOperation.gas_used && (
                        <div>
                          <strong>Gas Used:</strong>
                          <div>{selectedOperation.gas_used}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {selectedOperation.errors &&
                  selectedOperation.errors.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        Erreurs ({selectedOperation.errors.length})
                      </h3>
                      <div className="space-y-3">
                        {selectedOperation.errors.map((error) => (
                          <div
                            key={error.id}
                            className="bg-red-50 p-4 rounded-lg border border-red-200"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {getPhaseBadge(error.phase)}
                              <Badge variant="secondary">
                                Tentative {error.attempt_number}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDate(error.created_at)}
                              </span>
                            </div>
                            <div className="font-medium text-red-800">
                              {error.error_type}
                            </div>
                            <div className="text-sm text-red-700 mt-1">
                              {error.error_message}
                            </div>
                            {error.error_code && (
                              <div className="text-xs text-gray-500 mt-1 font-mono">
                                Code: {error.error_code}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* NFT Results */}
                {selectedOperation.nft_results &&
                  selectedOperation.nft_results.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">
                        Résultats NFT ({selectedOperation.nft_results.length})
                      </h3>
                      <div className="text-sm text-gray-500">
                        {selectedOperation.nft_results.length} NFT(s)
                        enregistré(s)
                      </div>
                    </div>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-between">
                <div>
                  {selectedOperation.status === "failed" && (
                    <Button
                      onClick={() => handleRetry(selectedOperation.id)}
                      disabled={actionLoading === selectedOperation.id}
                      className="flex items-center gap-2"
                    >
                      {actionLoading === selectedOperation.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Relancer l'opération
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowOperationDetails(false)}
                >
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

export default AdminMinting;
