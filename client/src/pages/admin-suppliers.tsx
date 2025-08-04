import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { type Supplier, type InsertSupplier } from "@shared/mysql-schema";

export default function AdminSuppliers() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Partial<InsertSupplier>>({});
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao criar fornecedor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsCreateOpen(false);
      setFormData({});
      toast({ title: "Fornecedor criado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar fornecedor", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; supplier: Partial<InsertSupplier> }) => {
      const response = await fetch(`/api/suppliers/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.supplier),
      });
      if (!response.ok) throw new Error("Erro ao atualizar fornecedor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setEditingSupplier(null);
      setFormData({});
      toast({ title: "Fornecedor atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar fornecedor", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao excluir fornecedor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Fornecedor excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir fornecedor", variant: "destructive" });
    },
  });

  const filteredSuppliers = suppliers.filter((supplier: Supplier) =>
    supplier.nome_fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.cnpj.includes(searchTerm) ||
    supplier.nome_responsavel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, supplier: formData });
    } else {
      createMutation.mutate(formData as InsertSupplier);
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
  };

  const resetForm = () => {
    setFormData({});
    setEditingSupplier(null);
    setIsCreateOpen(false);
  };

  if (isLoading) {
    return <div className="p-6">Carregando fornecedores...</div>;
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
          <h1 className="text-2xl font-bold">Gerenciar Fornecedores</h1>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-supplier">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Fornecedor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome_fornecedor">Nome do Fornecedor</Label>
                <Input
                  id="nome_fornecedor"
                  data-testid="input-supplier-name"
                  value={formData.nome_fornecedor || ""}
                  onChange={(e) => setFormData({ ...formData, nome_fornecedor: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  data-testid="input-supplier-cnpj"
                  value={formData.cnpj || ""}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nome_responsavel">Nome do Responsável</Label>
                <Input
                  id="nome_responsavel"
                  data-testid="input-supplier-responsible"
                  value={formData.nome_responsavel || ""}
                  onChange={(e) => setFormData({ ...formData, nome_responsavel: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  data-testid="input-supplier-phone"
                  value={formData.telefone || ""}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  data-testid="input-supplier-address"
                  value={formData.endereco || ""}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valor_orcamento">Valor do Orçamento (R$)</Label>
                <Input
                  id="valor_orcamento"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  data-testid="input-supplier-budget"
                  value={formData.valor_orcamento || ""}
                  onChange={(e) => setFormData({ ...formData, valor_orcamento: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" data-testid="button-save-supplier" disabled={createMutation.isPending}>
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
            placeholder="Buscar por nome, CNPJ ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-suppliers"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fornecedores ({filteredSuppliers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome do Fornecedor</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Valor Orçamento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier: Supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell data-testid={`text-supplier-id-${supplier.id}`}>{supplier.id}</TableCell>
                  <TableCell data-testid={`text-supplier-name-${supplier.id}`}>{supplier.nome_fornecedor}</TableCell>
                  <TableCell data-testid={`text-supplier-cnpj-${supplier.id}`}>{supplier.cnpj}</TableCell>
                  <TableCell data-testid={`text-supplier-responsible-${supplier.id}`}>{supplier.nome_responsavel}</TableCell>
                  <TableCell data-testid={`text-supplier-phone-${supplier.id}`}>{supplier.telefone}</TableCell>
                  <TableCell data-testid={`text-supplier-address-${supplier.id}`}>{supplier.endereco}</TableCell>
                  <TableCell data-testid={`text-supplier-budget-${supplier.id}`}>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(parseFloat(supplier.valor_orcamento.toString()))}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(supplier)}
                        data-testid={`button-edit-supplier-${supplier.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(supplier.id)}
                        data-testid={`button-delete-supplier-${supplier.id}`}
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
      <Dialog open={!!editingSupplier} onOpenChange={() => setEditingSupplier(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-nome_fornecedor">Nome do Fornecedor</Label>
              <Input
                id="edit-nome_fornecedor"
                value={formData.nome_fornecedor || ""}
                onChange={(e) => setFormData({ ...formData, nome_fornecedor: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-cnpj">CNPJ</Label>
              <Input
                id="edit-cnpj"
                value={formData.cnpj || ""}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-nome_responsavel">Nome do Responsável</Label>
              <Input
                id="edit-nome_responsavel"
                value={formData.nome_responsavel || ""}
                onChange={(e) => setFormData({ ...formData, nome_responsavel: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-telefone">Telefone</Label>
              <Input
                id="edit-telefone"
                value={formData.telefone || ""}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-endereco">Endereço</Label>
              <Input
                id="edit-endereco"
                value={formData.endereco || ""}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-valor_orcamento">Valor do Orçamento (R$)</Label>
              <Input
                id="edit-valor_orcamento"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.valor_orcamento || ""}
                onChange={(e) => setFormData({ ...formData, valor_orcamento: parseFloat(e.target.value) || 0 })}
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