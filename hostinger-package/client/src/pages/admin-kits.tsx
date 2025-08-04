import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Package, Image as ImageIcon, Upload } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { type Kit, type InsertKit } from "@shared/mysql-schema";
import type { UploadResult } from "@uppy/core";

interface KitFormData {
  nome_peca: string;
  descricao: string;
  image_url: string;
}

export default function AdminKits() {
  const [showForm, setShowForm] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [formData, setFormData] = useState<KitFormData>({
    nome_peca: "",
    descricao: "",
    image_url: "",
  });
  const { toast } = useToast();

  const { data: kits, isLoading } = useQuery<Kit[]>({
    queryKey: ["/api/kits"],
  });

  const createKitMutation = useMutation({
    mutationFn: async (data: InsertKit) => {
      return apiRequest("POST", "/api/kits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kits"] });
      setShowForm(false);
      setFormData({ nome_peca: "", descricao: "", image_url: "" });
      toast({
        title: "Sucesso",
        description: "Kit criado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar kit",
        variant: "destructive",
      });
    },
  });

  const updateKitMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertKit> }) => {
      return apiRequest("PUT", `/api/kits/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kits"] });
      setEditingKit(null);
      setShowForm(false);
      setFormData({ nome_peca: "", descricao: "", image_url: "" });
      toast({
        title: "Sucesso",
        description: "Kit atualizado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar kit",
        variant: "destructive",
      });
    },
  });

  const deleteKitMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/kits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kits"] });
      toast({
        title: "Sucesso",
        description: "Kit removido com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover kit",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingKit) {
      updateKitMutation.mutate({
        id: editingKit.id,
        data: formData,
      });
    } else {
      createKitMutation.mutate(formData);
    }
  };

  const handleEdit = (kit: Kit) => {
    setEditingKit(kit);
    setFormData({
      nome_peca: kit.nome_peca,
      descricao: kit.descricao,
      image_url: kit.image_url || "",
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este kit?")) {
      deleteKitMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingKit(null);
    setFormData({ nome_peca: "", descricao: "", image_url: "" });
    setShowForm(false);
  };

  if (isLoading) {
    return <div className="p-6">Carregando kits...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciar Kits</h1>
          <p className="text-gray-600 mt-1">Adicione, edite ou remova kits de instalação</p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => resetForm()}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-add-kit"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Kit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingKit ? "Editar Kit" : "Adicionar Novo Kit"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome_peca">Nome da Peça</Label>
                <Input
                  id="nome_peca"
                  value={formData.nome_peca}
                  onChange={(e) => setFormData({ ...formData, nome_peca: e.target.value })}
                  required
                  data-testid="input-nome-peca"
                />
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                  rows={3}
                  data-testid="input-descricao"
                />
              </div>
              
              <div>
                <Label>Imagem do Kit</Label>
                <div className="space-y-3">
                  {formData.image_url && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img 
                        src={formData.image_url} 
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Imagem selecionada</p>
                        <p className="text-xs text-gray-500">Clique em "Adicionar Imagem" para alterar</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, image_url: "" })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    onGetUploadParameters={async () => {
                      const response = await apiRequest("POST", "/api/objects/upload");
                      return {
                        method: "PUT" as const,
                        url: (response as any).uploadURL,
                      };
                    }}
                    onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                      if (result.successful && result.successful.length > 0) {
                        const uploadedFile = result.successful[0];
                        const imageURL = (uploadedFile as any).uploadURL || "";
                        if (imageURL) {
                          setFormData({ ...formData, image_url: imageURL });
                          toast({
                            title: "Sucesso",
                            description: "Imagem enviada com sucesso!",
                          });
                        }
                      }
                    }}
                    buttonClassName="w-full"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>{formData.image_url ? "Alterar Imagem" : "Adicionar Imagem"}</span>
                    </div>
                  </ObjectUploader>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createKitMutation.isPending || updateKitMutation.isPending}
                  data-testid="button-save-kit"
                >
                  {editingKit ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Kits ({kits?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {kits && kits.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagem</TableHead>
                    <TableHead>Nome da Peça</TableHead>
                    <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                    <TableHead className="text-center">Uso (S/N)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kits.map((kit) => (
                    <TableRow key={kit.id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {kit.image_url ? (
                            <img 
                              src={kit.image_url} 
                              alt={kit.nome_peca}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{kit.nome_peca}</TableCell>
                      <TableCell className="hidden sm:table-cell text-gray-600 max-w-xs truncate">
                        {kit.descricao}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          <span className="text-green-600 font-medium">{kit.sim}</span>
                          {" / "}
                          <span className="text-red-600 font-medium">{kit.nao}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(kit)}
                            data-testid={`button-edit-${kit.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(kit.id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-${kit.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum kit encontrado</p>
              <Button 
                onClick={() => setShowForm(true)}
                className="mt-4"
                data-testid="button-add-first-kit"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Kit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}