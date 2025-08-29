import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Search, MapPin, Users, Building2, Trash2, Edit3, Calendar, Clock } from "lucide-react";
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
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedStores, setSelectedStores] = useState<Store[]>([]);
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

  // Query para buscar itens da rota selecionada
  const { data: routeItems } = useQuery<RouteItem[]>({
    queryKey: ['/api/routes', selectedRoute?.id, 'items'],
    enabled: !!selectedRoute?.id,
  });

  // Mutation para criar rota
  const createRouteMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/routes', 'POST', data);
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
      return await apiRequest(`/api/routes/${id}`, 'DELETE');
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
    setSupplierSearch("");
    setStoreSearch("");
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
      await apiRequest(`/api/routes/${route.id}/items`, 'POST', {
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

                  {/* Seleção de Lojas */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Associar Lojas</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar loja por código, cidade..."
                        className="pl-10"
                        value={storeSearch}
                        onChange={(e) => setStoreSearch(e.target.value)}
                      />
                    </div>
                    
                    {stores && stores.length > 0 && (
                      <div className="max-h-32 overflow-y-auto border rounded-lg">
                        {stores.map(store => (
                          <div
                            key={store.id}
                            className="p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0"
                            onClick={() => {
                              if (!selectedStores.find(s => s.id === store.id)) {
                                setSelectedStores(prev => [...prev, store]);
                                setStoreSearch("");
                              }
                            }}
                          >
                            <div className="font-medium">{store.nome_loja}</div>
                            <div className="text-sm text-gray-600">
                              {store.codigo_loja} • {store.cidade}, {store.uf}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedStores.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Lojas Selecionadas ({selectedStores.length})</div>
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