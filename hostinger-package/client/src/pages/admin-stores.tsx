import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search, ArrowLeft } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { type Store, type InsertStore } from "@shared/mysql-schema";

export default function AdminStores() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Partial<InsertStore>>({});
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: stores = [], isLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertStore) => {
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao criar loja");
      return response.json();
    },
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
    mutationFn: async (data: { codigo_loja: string; store: Partial<InsertStore> }) => {
      const response = await fetch(`/api/stores/${data.codigo_loja}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.store),
      });
      if (!response.ok) throw new Error("Erro ao atualizar loja");
      return response.json();
    },
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
    mutationFn: async (codigo_loja: string) => {
      const response = await fetch(`/api/stores/${codigo_loja}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao excluir loja");
      return; // Não retorna JSON para status 204
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Loja excluída com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir loja", variant: "destructive" });
    },
  });

  const filteredStores = stores.filter((store: Store) =>
    store.nome_loja.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.codigo_loja.includes(searchTerm) ||
    store.nome_operador.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/admin")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Gerenciar Lojas</h1>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-store">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Loja
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Loja</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_operador">Nome do Operador</Label>
                  <Input
                    id="nome_operador"
                    data-testid="input-store-operator"
                    value={formData.nome_operador || ""}
                    onChange={(e) => setFormData({ ...formData, nome_operador: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telefone_loja">Telefone da Loja</Label>
                  <Input
                    id="telefone_loja"
                    data-testid="input-store-phone"
                    value={formData.telefone_loja || ""}
                    onChange={(e) => setFormData({ ...formData, telefone_loja: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    data-testid="input-store-street"
                    value={formData.logradouro || ""}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    data-testid="input-store-number"
                    value={formData.numero || ""}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    data-testid="input-store-complement"
                    value={formData.complemento || ""}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    data-testid="input-store-neighborhood"
                    value={formData.bairro || ""}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    data-testid="input-store-city"
                    value={formData.cidade || ""}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="uf">UF</Label>
                  <Input
                    id="uf"
                    data-testid="input-store-state"
                    value={formData.uf || ""}
                    onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    data-testid="input-store-zipcode"
                    value={formData.cep || ""}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="regiao">Região</Label>
                <Input
                  id="regiao"
                  data-testid="input-store-region"
                  value={formData.regiao || ""}
                  onChange={(e) => setFormData({ ...formData, regiao: e.target.value })}
                  required
                />
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
            placeholder="Buscar por nome, código ou cidade..."
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome da Loja</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>CEP</TableHead>
                  <TableHead>Região</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.map((store: Store) => (
                  <TableRow key={store.codigo_loja}>
                    <TableCell data-testid={`text-store-code-${store.codigo_loja}`}>{store.codigo_loja}</TableCell>
                    <TableCell data-testid={`text-store-name-${store.codigo_loja}`}>{store.nome_loja}</TableCell>
                    <TableCell data-testid={`text-store-operator-${store.codigo_loja}`}>{store.nome_operador}</TableCell>
                    <TableCell data-testid={`text-store-address-${store.codigo_loja}`}>
                      {store.logradouro}, {store.numero} {store.complemento && `- ${store.complemento}`}
                      <br />
                      {store.bairro}
                    </TableCell>
                    <TableCell data-testid={`text-store-city-${store.codigo_loja}`}>{store.cidade}/{store.uf}</TableCell>
                    <TableCell data-testid={`text-store-cep-${store.codigo_loja}`}>{store.cep}</TableCell>
                    <TableCell data-testid={`text-store-region-${store.codigo_loja}`}>{store.regiao}</TableCell>
                    <TableCell data-testid={`text-store-phone-${store.codigo_loja}`}>{store.telefone_loja}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(store)}
                          data-testid={`button-edit-store-${store.codigo_loja}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(store.codigo_loja)}
                          data-testid={`button-delete-store-${store.codigo_loja}`}
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
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingStore} onOpenChange={() => setEditingStore(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Loja</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nome_operador">Nome do Operador</Label>
                <Input
                  id="edit-nome_operador"
                  value={formData.nome_operador || ""}
                  onChange={(e) => setFormData({ ...formData, nome_operador: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-telefone_loja">Telefone da Loja</Label>
                <Input
                  id="edit-telefone_loja"
                  value={formData.telefone_loja || ""}
                  onChange={(e) => setFormData({ ...formData, telefone_loja: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-logradouro">Logradouro</Label>
                <Input
                  id="edit-logradouro"
                  value={formData.logradouro || ""}
                  onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-numero">Número</Label>
                <Input
                  id="edit-numero"
                  value={formData.numero || ""}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-complemento">Complemento</Label>
                <Input
                  id="edit-complemento"
                  value={formData.complemento || ""}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-bairro">Bairro</Label>
                <Input
                  id="edit-bairro"
                  value={formData.bairro || ""}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-cidade">Cidade</Label>
                <Input
                  id="edit-cidade"
                  value={formData.cidade || ""}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-uf">UF</Label>
                <Input
                  id="edit-uf"
                  value={formData.uf || ""}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-cep">CEP</Label>
                <Input
                  id="edit-cep"
                  value={formData.cep || ""}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-regiao">Região</Label>
              <Input
                id="edit-regiao"
                value={formData.regiao || ""}
                onChange={(e) => setFormData({ ...formData, regiao: e.target.value })}
                required
              />
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