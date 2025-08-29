import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Search, MapPin, Users, Building2, Trash2, Edit3, Calendar, Clock, Eye } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface Supplier {
  id: number;
  nome_fornecedor: string;
  cnpj: string;
  cpf: string;
}

interface Store {
  id: number;
  codigo_loja: string;
  nome_loja: string;
  logradouro: string;
  cidade: string;
  uf: string;
}

interface SupplierEmployee {
  id: number;
  fornecedor_id: number;
  nome_funcionario: string;
  cpf?: string;
  telefone?: string;
}

interface Route {
  id: number;
  nome: string;
  fornecedor_id: number;
  status: 'ativa' | 'inativa' | 'concluida';
  observacoes?: string | null;
  data_criacao: string;
  data_prevista?: string | null;
  data_execucao?: string | null;
  created_by: number;
}

interface RouteItem {
  id: number;
  rota_id: number;
  loja_id: string;
  ordem_visita: number;
  status: 'pendente' | 'em_progresso' | 'concluido';
  data_prevista?: string | null;
  data_execucao?: string | null;
  observacoes?: string | null;
  tempo_estimado?: number | null;
  nome_loja?: string;
  logradouro?: string;
  cidade?: string;
  uf?: string;
}

export default function AdminRoutes() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [storeFilters, setStoreFilters] = useState({ codigo_loja: "", cidade: "", uf: "", nome_loja: "" });
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedStores, setSelectedStores] = useState<Store[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<SupplierEmployee[]>([]);
  const [routeForm, setRouteForm] = useState({
    nome: "",
    observacoes: "",
    data_prevista: "",
    status: "ativa" as Route['status']
  });

  const queryClient = useQueryClient();

  // Query para buscar rotas
  const { data: routes, isLoading: routesLoading } = useQuery<Route[]>({
    queryKey: ['/api/routes'],
  });

  // Query para buscar fornecedores
  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers/search', supplierSearch],
    queryFn: () => fetch(`/api/suppliers/search?q=${encodeURIComponent(supplierSearch)}`).then(res => res.json()),
    enabled: supplierSearch.length >= 2,
  });

  // Query para buscar lojas
  const { data: stores } = useQuery<Store[]>({
    queryKey: ['/api/stores/search', storeSearch],
    queryFn: () => fetch(`/api/stores/search?q=${encodeURIComponent(storeSearch)}`).then(res => res.json()),
    enabled: storeSearch.length >= 2,
  });

  // Query para buscar lojas com filtros
  const { data: filteredStores } = useQuery<Store[]>({
    queryKey: ['/api/stores/filter', storeFilters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(storeFilters).forEach(([key, value]) => {
        if (value && value.length >= 2) params.append(key, value);
      });
      return fetch(`/api/stores/filter?${params.toString()}`).then(res => res.json());
    },
    enabled: Object.values(storeFilters).some(value => value && value.length >= 2),
  });

  // Query para buscar funcionários do fornecedor selecionado
  const { data: employees } = useQuery<SupplierEmployee[]>({
    queryKey: ['/api/suppliers', selectedSupplier?.id, 'employees'],
    queryFn: () => fetch(`/api/suppliers/${selectedSupplier?.id}/employees`).then(res => res.json()),
    enabled: !!selectedSupplier?.id,
  });

  // Query para buscar itens da rota selecionada
  const { data: routeItems } = useQuery<RouteItem[]>({
    queryKey: ['/api/routes', selectedRoute?.id, 'items'],
    enabled: !!selectedRoute?.id,
  });

  // Mutation para criar rota
  const createRouteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/routes', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      setShowCreateDialog(false);
      resetForm();
    },
  });

  // Mutation para deletar rota
  const deleteRouteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/routes/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
    },
  });

  const resetForm = () => {
    setRouteForm({
      nome: "",
      observacoes: "",
      data_prevista: "",
      status: "ativa"
    });
    setSelectedSupplier(null);
    setSelectedStores([]);
    setSelectedEmployees([]);
    setSupplierSearch("");
    setStoreSearch("");
    setStoreFilters({ codigo_loja: "", cidade: "", uf: "", nome_loja: "" });
  };

  const handleCreateRoute = async () => {
    if (!selectedSupplier || selectedStores.length === 0 || !routeForm.nome) {
      return;
    }

    const routeData = {
      nome: routeForm.nome,
      fornecedor_id: selectedSupplier.id,
      status: routeForm.status,
      observacoes: routeForm.observacoes || null,
      data_prevista: routeForm.data_prevista || null,
      created_by: 1 // TODO: pegar do contexto do admin logado
    };

    const route = await createRouteMutation.mutateAsync(routeData);

    // Criar itens da rota para cada loja selecionada
    for (let i = 0; i < selectedStores.length; i++) {
      const store = selectedStores[i];
      await apiRequest('POST', `/api/routes/${route.id}/items`, {
        loja_id: store.codigo_loja,
        ordem_visita: i + 1,
        status: 'pendente'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ativa: { variant: "default" as const, text: "Ativa", color: "bg-green-500" },
      inativa: { variant: "secondary" as const, text: "Inativa", color: "bg-gray-500" },
      concluida: { variant: "outline" as const, text: "Concluída", color: "bg-blue-500" },
      pendente: { variant: "secondary" as const, text: "Pendente", color: "bg-yellow-500" },
      em_progresso: { variant: "default" as const, text: "Em Progresso", color: "bg-orange-500" },
      concluido: { variant: "outline" as const, text: "Concluído", color: "bg-green-500" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ativa;
    return (
      <Badge variant={config.variant}>
        <div className={`w-2 h-2 rounded-full ${config.color} mr-2`}></div>
        {config.text}
      </Badge>
    );
  };

  if (routesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando rotas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6 lg:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Dashboard
                  </Button>
                </Link>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Gerenciamento de Rotas
              </h1>
              <p className="text-gray-600">Organize as rotas de instalação dos fornecedores</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Rota
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Nova Rota</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Informações da Rota */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Informações da Rota</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Nome da Rota</label>
                        <Input
                          placeholder="Ex: Rota São Paulo - Janeiro 2025"
                          value={routeForm.nome}
                          onChange={(e) => setRouteForm(prev => ({ ...prev, nome: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Status</label>
                        <Select
                          value={routeForm.status}
                          onValueChange={(value: Route['status']) => setRouteForm(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativa">Ativa</SelectItem>
                            <SelectItem value="inativa">Inativa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Data Prevista</label>
                      <Input
                        type="date"
                        value={routeForm.data_prevista}
                        onChange={(e) => setRouteForm(prev => ({ ...prev, data_prevista: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Observações</label>
                      <Textarea
                        placeholder="Observações sobre a rota..."
                        value={routeForm.observacoes}
                        onChange={(e) => setRouteForm(prev => ({ ...prev, observacoes: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Seleção de Fornecedor */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Selecionar Fornecedor</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por nome, CNPJ ou CPF..."
                        className="pl-10"
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                      />
                    </div>
                    
                    {suppliers && suppliers.length > 0 && (
                      <div className="max-h-32 overflow-y-auto border rounded-lg">
                        {suppliers.map(supplier => (
                          <div
                            key={supplier.id}
                            className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                              selectedSupplier?.id === supplier.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setSupplierSearch(supplier.nome_fornecedor);
                              setSelectedEmployees([]); // Reset employees when changing supplier
                            }}
                          >
                            <div className="font-medium">{supplier.nome_fornecedor}</div>
                            <div className="text-sm text-gray-600">
                              CNPJ: {supplier.cnpj} {supplier.cpf && `• CPF: ${supplier.cpf}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedSupplier && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-green-800">{selectedSupplier.nome_fornecedor}</div>
                            <div className="text-sm text-green-600">Selecionado</div>
                          </div>
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Seleção de Funcionários do Fornecedor */}
                  {selectedSupplier && (
                    <div className="space-y-4">
                      <h3 className="font-medium">Funcionário do Fornecedor</h3>
                      {employees && employees.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">Selecione um ou mais funcionários:</div>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {employees.map(employee => (
                              <label key={employee.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="mr-3 rounded"
                                  checked={selectedEmployees.some(e => e.id === employee.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedEmployees(prev => [...prev, employee]);
                                    } else {
                                      setSelectedEmployees(prev => prev.filter(emp => emp.id !== employee.id));
                                    }
                                  }}
                                />
                                <div>
                                  <div className="font-medium">{employee.nome_funcionario}</div>
                                  <div className="text-sm text-gray-600">
                                    {employee.cpf && `CPF: ${employee.cpf}`} {employee.telefone && `• Tel: ${employee.telefone}`}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                          
                          {selectedEmployees.length > 0 && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="text-sm font-medium text-blue-800 mb-1">
                                Funcionários Selecionados ({selectedEmployees.length})
                              </div>
                              <div className="space-y-1">
                                {selectedEmployees.map(emp => (
                                  <div key={emp.id} className="text-sm text-blue-600">
                                    • {emp.nome_funcionario}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="text-sm text-yellow-800">Nenhum funcionário cadastrado para este fornecedor.</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Seleção de Lojas */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Associar Lojas</h3>
                    
                    {/* Campos de Busca Separados */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Código da Loja</label>
                        <Input
                          placeholder="Ex: 50117"
                          value={storeFilters.codigo_loja}
                          onChange={(e) => setStoreFilters(prev => ({ ...prev, codigo_loja: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Nome da Loja</label>
                        <Input
                          placeholder="Ex: HELP!"
                          value={storeFilters.nome_loja}
                          onChange={(e) => setStoreFilters(prev => ({ ...prev, nome_loja: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Cidade</label>
                        <Input
                          placeholder="Ex: São Paulo"
                          value={storeFilters.cidade}
                          onChange={(e) => setStoreFilters(prev => ({ ...prev, cidade: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Estado</label>
                        <Input
                          placeholder="Ex: SP"
                          value={storeFilters.uf}
                          onChange={(e) => setStoreFilters(prev => ({ ...prev, uf: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    
                    {/* Resultados da Busca com Checkbox */}
                    {filteredStores && filteredStores.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-700">Resultados da Busca ({filteredStores.length})</div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newStores = filteredStores.filter(store => !selectedStores.find(s => s.id === store.id));
                              setSelectedStores(prev => [...prev, ...newStores]);
                            }}
                            disabled={filteredStores.every(store => selectedStores.find(s => s.id === store.id))}
                            className="text-xs"
                          >
                            Selecionar Todas
                          </Button>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {filteredStores.map(store => (
                            <label key={store.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                className="mr-3 rounded"
                                checked={selectedStores.some(s => s.id === store.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStores(prev => [...prev, store]);
                                  } else {
                                    setSelectedStores(prev => prev.filter(s => s.id !== store.id));
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{store.nome_loja}</div>
                                <div className="text-sm text-gray-600">
                                  {store.codigo_loja} • {store.cidade}, {store.uf}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Lojas Selecionadas */}
                    {selectedStores.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-blue-700">Lojas Selecionadas ({selectedStores.length})</div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStores([])}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Limpar Todas
                          </Button>
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {selectedStores.map((store, index) => (
                            <div key={store.id} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center">
                                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-blue-800">{store.nome_loja}</div>
                                  <div className="text-sm text-blue-600">{store.codigo_loja} • {store.cidade}, {store.uf}</div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedStores(prev => prev.filter(s => s.id !== store.id))}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Mensagem quando não há resultados */}
                    {Object.values(storeFilters).some(value => value && value.length >= 2) && filteredStores && filteredStores.length === 0 && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                        <div className="text-sm text-gray-600">Nenhuma loja encontrada com os filtros aplicados.</div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateRoute}
                      disabled={!selectedSupplier || selectedStores.length === 0 || !routeForm.nome || createRouteMutation.isPending}
                      className="bg-gradient-to-r from-blue-500 to-blue-600"
                    >
                      {createRouteMutation.isPending ? "Criando..." : "Criar Rota"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Rotas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Rotas Cadastradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {routes && routes.length > 0 ? (
                  <div className="space-y-4">
                    {routes.map(route => (
                      <div
                        key={route.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedRoute?.id === route.id ? 'border-blue-300 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedRoute(route)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{route.nome}</h3>
                          {getStatusBadge(route.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Criada: {new Date(route.data_criacao).toLocaleDateString('pt-BR')}
                          </div>
                          {route.data_prevista && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              Prevista: {new Date(route.data_prevista).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end mt-3 space-x-2">
                          <Link href={`/admin/routes/${route.id}/track`}>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Acompanhar
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Implementar edição
                            }}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRouteMutation.mutate(route.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma rota cadastrada</h3>
                    <p className="text-gray-600 mb-4">Crie sua primeira rota para organizar as instalações</p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Rota
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detalhes da Rota Selecionada */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  {selectedRoute ? 'Detalhes da Rota' : 'Selecione uma Rota'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRoute ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">{selectedRoute.nome}</h3>
                      {getStatusBadge(selectedRoute.status)}
                    </div>
                    
                    {selectedRoute.observacoes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Observações</h4>
                        <p className="text-sm text-gray-600">{selectedRoute.observacoes}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Lojas da Rota</h4>
                      {routeItems && routeItems.length > 0 ? (
                        <div className="space-y-2">
                          {routeItems.map(item => (
                            <div key={item.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center">
                                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                                    {item.ordem_visita}
                                  </div>
                                  <div className="font-medium">{item.nome_loja || item.loja_id}</div>
                                </div>
                                {getStatusBadge(item.status)}
                              </div>
                              {item.cidade && (
                                <div className="text-sm text-gray-600 ml-9">
                                  {item.cidade}, {item.uf}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Nenhuma loja associada a esta rota</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Selecione uma rota para ver os detalhes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}