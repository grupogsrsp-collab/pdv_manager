import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, ArrowLeft, UserPlus, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { type Supplier, type InsertSupplier, type SupplierEmployee, type InsertSupplierEmployee } from "@shared/mysql-schema";

export default function AdminSuppliers() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"name" | "cnpj" | "cpf">("name");
  const [formData, setFormData] = useState<Partial<InsertSupplier>>({});
  const [showEmployeesDialog, setShowEmployeesDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [employeeFormData, setEmployeeFormData] = useState<Partial<InsertSupplierEmployee>>({});
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

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: { supplierId: number; employee: InsertSupplierEmployee }) => {
      const response = await fetch(`/api/suppliers/${data.supplierId}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.employee),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao criar funcionário: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", selectedSupplier?.id, "employees"] });
      setIsEmployeeFormOpen(false);
      setEmployeeFormData({});
      toast({ title: "Funcionário criado com sucesso!" });
    },
    onError: (error: Error) => {
      console.error("Erro na mutation de funcionário:", error);
      toast({ title: error.message || "Erro ao criar funcionário", variant: "destructive" });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/supplier-employees/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao excluir funcionário");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", selectedSupplier?.id, "employees"] });
      toast({ title: "Funcionário excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir funcionário", variant: "destructive" });
    },
  });

  const { data: employees = [] } = useQuery<SupplierEmployee[]>({
    queryKey: ["/api/suppliers", selectedSupplier?.id, "employees"],
    enabled: !!selectedSupplier?.id,
  });

  const filteredSuppliers = suppliers.filter((supplier: Supplier) => {
    if (searchType === "name") {
      return supplier.nome_fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
             supplier.nome_responsavel.toLowerCase().includes(searchTerm.toLowerCase());
    } else if (searchType === "cnpj") {
      return supplier.cnpj.includes(searchTerm);
    } else if (searchType === "cpf") {
      return supplier.cpf?.includes(searchTerm);
    }
    return true;
  });

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

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Dados do funcionário sendo enviados:', employeeFormData);
    if (selectedSupplier && employeeFormData.nome_funcionario) {
      const employeeData = {
        ...employeeFormData,
        fornecedor_id: selectedSupplier.id
      };
      console.log('Dados completos do funcionário:', employeeData);
      createEmployeeMutation.mutate({
        supplierId: selectedSupplier.id,
        employee: employeeData as InsertSupplierEmployee
      });
    } else {
      toast({ title: "Nome do funcionário é obrigatório", variant: "destructive" });
    }
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
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  data-testid="input-supplier-cnpj"
                  value={formData.cnpj || ""}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  data-testid="input-supplier-cpf"
                  value={formData.cpf || ""}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  data-testid="input-supplier-phone"
                  value={formData.telefone || ""}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  data-testid="input-supplier-address"
                  value={formData.endereco || ""}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select 
                  value={formData.estado || ""} 
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger data-testid="select-supplier-state">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC">Acre</SelectItem>
                    <SelectItem value="AL">Alagoas</SelectItem>
                    <SelectItem value="AP">Amapá</SelectItem>
                    <SelectItem value="AM">Amazonas</SelectItem>
                    <SelectItem value="BA">Bahia</SelectItem>
                    <SelectItem value="CE">Ceará</SelectItem>
                    <SelectItem value="DF">Distrito Federal</SelectItem>
                    <SelectItem value="ES">Espírito Santo</SelectItem>
                    <SelectItem value="GO">Goiás</SelectItem>
                    <SelectItem value="MA">Maranhão</SelectItem>
                    <SelectItem value="MT">Mato Grosso</SelectItem>
                    <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                    <SelectItem value="MG">Minas Gerais</SelectItem>
                    <SelectItem value="PA">Pará</SelectItem>
                    <SelectItem value="PB">Paraíba</SelectItem>
                    <SelectItem value="PR">Paraná</SelectItem>
                    <SelectItem value="PE">Pernambuco</SelectItem>
                    <SelectItem value="PI">Piauí</SelectItem>
                    <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                    <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                    <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                    <SelectItem value="RO">Rondônia</SelectItem>
                    <SelectItem value="RR">Roraima</SelectItem>
                    <SelectItem value="SC">Santa Catarina</SelectItem>
                    <SelectItem value="SP">São Paulo</SelectItem>
                    <SelectItem value="SE">Sergipe</SelectItem>
                    <SelectItem value="TO">Tocantins</SelectItem>
                  </SelectContent>
                </Select>
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

      <div className="mb-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={`Buscar por ${searchType === 'name' ? 'nome' : searchType === 'cnpj' ? 'CNPJ' : 'CPF'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-suppliers"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={searchType === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setSearchType('name'); setSearchTerm(''); }}
          >
            Nome
          </Button>
          <Button
            variant={searchType === 'cnpj' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setSearchType('cnpj'); setSearchTerm(''); }}
          >
            CNPJ
          </Button>
          <Button
            variant={searchType === 'cpf' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setSearchType('cpf'); setSearchTerm(''); }}
          >
            CPF
          </Button>
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
                <TableHead>CPF</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Estado</TableHead>
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
                  <TableCell data-testid={`text-supplier-cpf-${supplier.id}`}>{supplier.cpf}</TableCell>
                  <TableCell data-testid={`text-supplier-responsible-${supplier.id}`}>{supplier.nome_responsavel}</TableCell>
                  <TableCell data-testid={`text-supplier-phone-${supplier.id}`}>{supplier.telefone}</TableCell>
                  <TableCell data-testid={`text-supplier-state-${supplier.id}`}>{supplier.estado}</TableCell>
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
                        variant="outline"
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setShowEmployeesDialog(true);
                        }}
                        data-testid={`button-employees-${supplier.id}`}
                      >
                        <Users className="h-4 w-4" />
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
              />
            </div>
            <div>
              <Label htmlFor="edit-cnpj">CNPJ</Label>
              <Input
                id="edit-cnpj"
                value={formData.cnpj || ""}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-cpf">CPF</Label>
              <Input
                id="edit-cpf"
                value={formData.cpf || ""}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-nome_responsavel">Nome do Responsável</Label>
              <Input
                id="edit-nome_responsavel"
                value={formData.nome_responsavel || ""}
                onChange={(e) => setFormData({ ...formData, nome_responsavel: e.target.value })}
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
              <Label htmlFor="edit-estado">Estado</Label>
              <Select 
                value={formData.estado || ""} 
                onValueChange={(value) => setFormData({ ...formData, estado: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">Acre</SelectItem>
                  <SelectItem value="AL">Alagoas</SelectItem>
                  <SelectItem value="AP">Amapá</SelectItem>
                  <SelectItem value="AM">Amazonas</SelectItem>
                  <SelectItem value="BA">Bahia</SelectItem>
                  <SelectItem value="CE">Ceará</SelectItem>
                  <SelectItem value="DF">Distrito Federal</SelectItem>
                  <SelectItem value="ES">Espírito Santo</SelectItem>
                  <SelectItem value="GO">Goiás</SelectItem>
                  <SelectItem value="MA">Maranhão</SelectItem>
                  <SelectItem value="MT">Mato Grosso</SelectItem>
                  <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                  <SelectItem value="MG">Minas Gerais</SelectItem>
                  <SelectItem value="PA">Pará</SelectItem>
                  <SelectItem value="PB">Paraíba</SelectItem>
                  <SelectItem value="PR">Paraná</SelectItem>
                  <SelectItem value="PE">Pernambuco</SelectItem>
                  <SelectItem value="PI">Piauí</SelectItem>
                  <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                  <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                  <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                  <SelectItem value="RO">Rondônia</SelectItem>
                  <SelectItem value="RR">Roraima</SelectItem>
                  <SelectItem value="SC">Santa Catarina</SelectItem>
                  <SelectItem value="SP">São Paulo</SelectItem>
                  <SelectItem value="SE">Sergipe</SelectItem>
                  <SelectItem value="TO">Tocantins</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Employees Management Dialog */}
      <Dialog open={showEmployeesDialog} onOpenChange={setShowEmployeesDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Funcionários - {selectedSupplier?.nome_fornecedor}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Lista de Funcionários</h3>
              <Dialog open={isEmployeeFormOpen} onOpenChange={setIsEmployeeFormOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Funcionário
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Novo Funcionário</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="employee-name">Nome do Funcionário</Label>
                      <Input
                        id="employee-name"
                        value={employeeFormData.nome_funcionario || ""}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, nome_funcionario: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="employee-cpf">CPF</Label>
                      <Input
                        id="employee-cpf"
                        value={employeeFormData.cpf || ""}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, cpf: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="employee-phone">Telefone</Label>
                      <Input
                        id="employee-phone"
                        value={employeeFormData.telefone || ""}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, telefone: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={createEmployeeMutation.isPending}>
                        {createEmployeeMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => {
                        setIsEmployeeFormOpen(false);
                        setEmployeeFormData({});
                      }}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {employees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.nome_funcionario}</TableCell>
                      <TableCell>{employee.cpf}</TableCell>
                      <TableCell>{employee.telefone}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                            disabled={deleteEmployeeMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum funcionário cadastrado para este fornecedor.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}