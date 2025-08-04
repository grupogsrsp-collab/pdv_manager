import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Store, type InsertStore } from "@shared/mysql-schema";

export default function AdminStores() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Partial<InsertStore>>({});
  const { toast } = useToast();

  const { data: stores, isLoading } = useQuery({
    queryKey: ["/api/stores"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertStore) => apiRequest("/api/stores", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      setIsCreateOpen(false);
      setFormData({});
      toast({ title: "Loja criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar loja", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { codigo_loja: string; store: Partial<InsertStore> }) =>
      apiRequest(`/api/stores/${data.codigo_loja}`, { method: "PATCH", body: JSON.stringify(data.store) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      setEditingStore(null);
      setFormData({});
      toast({ title: "Loja atualizada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar loja", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (codigo_loja: string) => apiRequest(`/api/stores/${codigo_loja}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Loja excluída com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir loja", variant: "destructive" });
    },
  });

  const filteredStores = stores?.filter((store: Store) =>
    store.nome_loja.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.codigo_loja.includes(searchTerm) ||
    store.nome_operador.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStore) {
      updateMutation.mutate({ codigo_loja: editingStore.codigo_loja, store: formData });
    } else {
      createMutation.mutate(formData as InsertStore);
    }
  };

  const openEditDialog = (store: Store) => {
    setEditingStore(store);
    setFormData(store);
  };

  const resetForm = () => {
    setFormData({});
    setEditingStore(null);
    setIsCreateOpen(false);
  };

  if (isLoading) {
    return <div className="p-6">Carregando lojas...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Lojas</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-store">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Loja
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Loja</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo_loja">Código da Loja</Label>
                  <Input
                    id="codigo_loja"
                    data-testid="input-store-code"
                    value={formData.codigo_loja || ""}
                    onChange={(e) => setFormData({ ...formData, codigo_loja: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nome_loja">Nome da Loja</Label>
                  <Input
                    id="nome_loja"
                    data-testid="input-store-name"
                    value={formData.nome_loja || ""}
                    onChange={(e) => setFormData({ ...formData, nome_loja: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nome_proprietario">Nome do Proprietário</Label>
                  <Input
                    id="nome_proprietario"
                    data-testid="input-store-owner"
                    value={formData.nome_proprietario || ""}
                    onChange={(e) => setFormData({ ...formData, nome_proprietario: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="input-store-email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    data-testid="input-store-password"
                    value={formData.senha || ""}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    data-testid="input-store-phone"
                    value={formData.telefone || ""}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    data-testid="input-store-address"
                    value={formData.endereco || ""}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    data-testid="input-store-city"
                    value={formData.cidade || ""}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    data-testid="input-store-state"
                    value={formData.estado || ""}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    data-testid="input-store-zip"
                    value={formData.cep || ""}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" data-testid="button-save-store" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, código, proprietário ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-stores"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lojas ({filteredStores.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome da Loja</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.map((store: Store) => (
                <TableRow key={store.id}>
                  <TableCell data-testid={`text-store-code-${store.id}`}>{store.codigo_loja}</TableCell>
                  <TableCell data-testid={`text-store-name-${store.id}`}>{store.nome_loja}</TableCell>
                  <TableCell data-testid={`text-store-owner-${store.id}`}>{store.nome_proprietario}</TableCell>
                  <TableCell data-testid={`text-store-email-${store.id}`}>{store.email}</TableCell>
                  <TableCell data-testid={`text-store-phone-${store.id}`}>{store.telefone}</TableCell>
                  <TableCell data-testid={`text-store-city-${store.id}`}>{store.cidade}</TableCell>
                  <TableCell data-testid={`text-store-state-${store.id}`}>{store.estado}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(store)}
                        data-testid={`button-edit-store-${store.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(store.id)}
                        data-testid={`button-delete-store-${store.id}`}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingStore} onOpenChange={() => setEditingStore(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Loja</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-codigo_loja">Código da Loja</Label>
                <Input
                  id="edit-codigo_loja"
                  value={formData.codigo_loja || ""}
                  onChange={(e) => setFormData({ ...formData, codigo_loja: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-nome_loja">Nome da Loja</Label>
                <Input
                  id="edit-nome_loja"
                  value={formData.nome_loja || ""}
                  onChange={(e) => setFormData({ ...formData, nome_loja: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-nome_proprietario">Nome do Proprietário</Label>
                <Input
                  id="edit-nome_proprietario"
                  value={formData.nome_proprietario || ""}
                  onChange={(e) => setFormData({ ...formData, nome_proprietario: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input
                  id="edit-telefone"
                  value={formData.telefone || ""}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-endereco">Endereço</Label>
                <Input
                  id="edit-endereco"
                  value={formData.endereco || ""}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-cidade">Cidade</Label>
                <Input
                  id="edit-cidade"
                  value={formData.cidade || ""}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-estado">Estado</Label>
                <Input
                  id="edit-estado"
                  value={formData.estado || ""}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-cep">CEP</Label>
                <Input
                  id="edit-cep"
                  value={formData.cep || ""}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}