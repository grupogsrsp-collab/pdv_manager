import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Search, MapPin, Users, Building2, Trash2, Edit3, Calendar, Clock, Eye, CheckCircle2, BarChart3, Activity, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);
  const [routeToEdit, setRouteToEdit] = useState<Route | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [storeFilters, setStoreFilters] = useState({ cidade: "", bairro: "", uf: "", nome_loja: "" });
  
  // Estados para edição
  const [editRouteForm, setEditRouteForm] = useState({ nome: '', status: '', data_prevista: '', observacoes: '' });
  const [editSelectedSupplier, setEditSelectedSupplier] = useState<Supplier | null>(null);
  const [editSelectedStores, setEditSelectedStores] = useState<Store[]>([]);
  const [editSelectedEmployees, setEditSelectedEmployees] = useState<SupplierEmployee[]>([]);
  const [editSupplierSearch, setEditSupplierSearch] = useState("");
  const [editStoreFilters, setEditStoreFilters] = useState({ cidade: "", bairro: "", uf: "", nome_loja: "" });
  const [currentRouteStores, setCurrentRouteStores] = useState<Store[]>([]);
  const [filters, setFilters] = useState({
    dataInicio: '',
    dataFim: '',
    comChamados: 'todos',
    codigoLoja: '',
    cidade: '',
    bairro: '',
    uf: 'todos',
    dataPrevistaInicio: '',
    dataPrevistaFim: ''
  });
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
  // Debounce para os filtros de texto (campos que o usuário digita)
  const [debouncedTextFilters, setDebouncedTextFilters] = useState({
    codigoLoja: filters.codigoLoja,
    cidade: filters.cidade,
    bairro: filters.bairro
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTextFilters({
        codigoLoja: filters.codigoLoja,
        cidade: filters.cidade,
        bairro: filters.bairro
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [filters.codigoLoja, filters.cidade, filters.bairro]);

  // Filtros finais que combinam filtros imediatos (data, select) com filtros com debounce (texto)
  const finalFilters = useMemo(() => ({
    dataInicio: filters.dataInicio,
    dataFim: filters.dataFim,
    comChamados: filters.comChamados,
    codigoLoja: debouncedTextFilters.codigoLoja,
    cidade: debouncedTextFilters.cidade,
    bairro: debouncedTextFilters.bairro,
    uf: filters.uf === 'todos' ? '' : filters.uf,
    dataPrevistaInicio: filters.dataPrevistaInicio,
    dataPrevistaFim: filters.dataPrevistaFim
  }), [
    filters.dataInicio,
    filters.dataFim,
    filters.comChamados,
    debouncedTextFilters.codigoLoja,
    debouncedTextFilters.cidade,
    debouncedTextFilters.bairro,
    filters.uf,
    filters.dataPrevistaInicio,
    filters.dataPrevistaFim
  ]);

  const { data: routes, isLoading: routesLoading } = useQuery<Route[]>({
    queryKey: ['/api/routes', finalFilters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (finalFilters.dataInicio) params.append('dataInicio', finalFilters.dataInicio);
      if (finalFilters.dataFim) params.append('dataFim', finalFilters.dataFim);
      if (finalFilters.comChamados && finalFilters.comChamados !== 'todos') params.append('comChamados', finalFilters.comChamados);
      if (finalFilters.codigoLoja) params.append('codigoLoja', finalFilters.codigoLoja);
      if (finalFilters.cidade) params.append('cidade', finalFilters.cidade);
      if (finalFilters.bairro) params.append('bairro', finalFilters.bairro);
      if (finalFilters.uf) params.append('uf', finalFilters.uf);
      if (finalFilters.dataPrevistaInicio) params.append('dataPrevistaInicio', finalFilters.dataPrevistaInicio);
      if (finalFilters.dataPrevistaFim) params.append('dataPrevistaFim', finalFilters.dataPrevistaFim);
      
      const url = `/api/routes${params.toString() ? '?' + params.toString() : ''}`;
      return fetch(url).then(res => res.json());
    },
  });

  // Query para buscar fornecedores
  const { data: suppliersRaw } = useQuery({
    queryKey: ['/api/suppliers/search', supplierSearch],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/search?q=${encodeURIComponent(supplierSearch)}`);
      if (!response.ok) return [];
      const results = await response.json();
      // Filtrar apenas fornecedores do resultado da busca
      return results.filter((item: any) => item.type === 'supplier').map((item: any) => item.data);
    },
    enabled: supplierSearch.length >= 2,
  });
  
  const suppliers = suppliersRaw as Supplier[] | undefined;

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

  // Queries para edição
  const { data: editSuppliersRaw } = useQuery({
    queryKey: ['/api/suppliers/search', editSupplierSearch],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/search?q=${encodeURIComponent(editSupplierSearch)}`);
      if (!response.ok) return [];
      const results = await response.json();
      return results.filter((item: any) => item.type === 'supplier').map((item: any) => item.data);
    },
    enabled: editSupplierSearch.length >= 2,
  });
  
  const editSuppliers = editSuppliersRaw as Supplier[] | undefined;

  const { data: editFilteredStores } = useQuery<Store[]>({
    queryKey: ['/api/stores/filter', editStoreFilters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(editStoreFilters).forEach(([key, value]) => {
        if (value && value.length >= 2) params.append(key, value);
      });
      return fetch(`/api/stores/filter?${params.toString()}`).then(res => res.json());
    },
    enabled: Object.values(editStoreFilters).some(value => value && value.length >= 2),
  });

  const { data: editEmployees } = useQuery<SupplierEmployee[]>({
    queryKey: ['/api/suppliers', editSelectedSupplier?.id, 'employees'],
    queryFn: () => fetch(`/api/suppliers/${editSelectedSupplier?.id}/employees`).then(res => res.json()),
    enabled: !!editSelectedSupplier?.id,
  });

  // Query para buscar lojas da rota atual em edição
  const { data: currentRouteItems } = useQuery<RouteItem[]>({
    queryKey: ['/api/routes', routeToEdit?.id, 'items'],
    queryFn: () => fetch(`/api/routes/${routeToEdit?.id}/items`).then(res => res.json()),
    enabled: !!routeToEdit?.id && showEditDialog,
  });

  // Query para buscar estatísticas das rotas
  const { data: routeStats } = useQuery<{rotasFinalizadas: number, rotasAtivas: number, lojasFinalizadas: number, lojasNaoFinalizadas: number}>({
    queryKey: ['/api/routes/stats'],
  });

  // Effect para carregar lojas da rota quando o diálogo de edição abrir
  useEffect(() => {
    if (currentRouteItems && currentRouteItems.length > 0) {
      // Converter RouteItems para Store format
      const stores: Store[] = currentRouteItems.map(item => ({
        id: parseInt(item.loja_id), // Converting string to number
        codigo_loja: item.loja_id,
        nome_loja: item.nome_loja || '',
        logradouro: item.logradouro || '',
        cidade: item.cidade || '',
        uf: item.uf || ''
      }));
      setCurrentRouteStores(stores);
    }
  }, [currentRouteItems]);

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

  // Mutation para finalizar rota
  const finishRouteMutation = useMutation({
    mutationFn: (routeId: number) => apiRequest('PATCH', `/api/routes/${routeId}/finish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      toast({
        title: "Sucesso",
        description: "Rota finalizada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao finalizar a rota.",
        variant: "destructive",
      });
    },
  });

  // Mutation para editar rota
  const editRouteMutation = useMutation({
    mutationFn: async (data: any) => {
      // Atualizar informações básicas da rota
      await apiRequest('PUT', `/api/routes/${routeToEdit?.id}`, {
        nome: data.nome,
        status: data.status,
        data_prevista: data.data_prevista,
        observacoes: data.observacoes,
        fornecedor_id: data.fornecedor_id
      });

      // Se foi selecionado um novo fornecedor, atualizar associações
      if (data.fornecedor_id && editSelectedSupplier) {
        // Atualizar funcionários se foram selecionados
        if (data.funcionarios && data.funcionarios.length > 0) {
          // Remover funcionários anteriores
          await apiRequest('DELETE', `/api/routes/${routeToEdit?.id}/employees`);
          // Adicionar novos funcionários
          for (const employeeId of data.funcionarios) {
            await apiRequest('POST', `/api/routes/${routeToEdit?.id}/employees`, {
              funcionario_id: employeeId
            });
          }
        }
      }

      // Gerenciar lojas da rota
      if (data.currentStores || data.newStores) {
        // Remover todos os itens atuais
        await apiRequest('DELETE', `/api/routes/${routeToEdit?.id}/items`);
        
        // Adicionar lojas atuais (que permaneceram)
        if (data.currentStores && data.currentStores.length > 0) {
          for (let i = 0; i < data.currentStores.length; i++) {
            await apiRequest('POST', `/api/routes/${routeToEdit?.id}/items`, {
              loja_id: data.currentStores[i],
              ordem_visita: i + 1,
              status: 'pendente'
            });
          }
        }
        
        // Adicionar novas lojas
        if (data.newStores && data.newStores.length > 0) {
          const startOrder = data.currentStores ? data.currentStores.length : 0;
          for (let i = 0; i < data.newStores.length; i++) {
            await apiRequest('POST', `/api/routes/${routeToEdit?.id}/items`, {
              loja_id: data.newStores[i],
              ordem_visita: startOrder + i + 1,
              status: 'pendente'
            });
          }
        }
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/routes', routeToEdit?.id, 'items'] });
      setShowEditDialog(false);
      setRouteToEdit(null);
      // Reset estados de edição
      setEditSelectedSupplier(null);
      setEditSelectedStores([]);
      setEditSelectedEmployees([]);
      setEditSupplierSearch("");
      setEditStoreFilters({ cidade: "", bairro: "", uf: "", nome_loja: "" });
      setCurrentRouteStores([]);
      toast({
        title: "Sucesso",
        description: "Rota editada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao editar a rota.",
        variant: "destructive",
      });
    },
  });

  // Mutation com confirmação para deletar
  const confirmDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/routes/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      setShowDeleteDialog(false);
      setRouteToDelete(null);
      toast({
        title: "Sucesso",
        description: "Rota excluída com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir a rota.",
        variant: "destructive",
      });
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
    setStoreFilters({ cidade: "", bairro: "", uf: "", nome_loja: "" });
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
      finalizada: { variant: "secondary" as const, text: "Finalizada", color: "bg-gray-500" },
      pendente: { variant: "secondary" as const, text: "Pendente", color: "bg-yellow-500" },
      em_progresso: { variant: "default" as const, text: "Em Progresso", color: "bg-orange-500" },
      concluido: { variant: "outline" as const, text: "Concluído", color: "bg-green-500" },
      // Novos status de instalação
      "Não Iniciado": { variant: "secondary" as const, text: "Não Iniciado", color: "bg-gray-500" },
      "Instalação Finalizada": { variant: "default" as const, text: "Instalação Finalizada", color: "bg-orange-500" },
      "Finalizado": { variant: "outline" as const, text: "Finalizado", color: "bg-green-500" },
      chamado_aberto: { variant: "destructive" as const, text: "Chamado Aberto", color: "bg-red-500" },
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
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Bairro</label>
                        <Input
                          placeholder="Ex: Vila Olímpia"
                          value={storeFilters.bairro}
                          onChange={(e) => setStoreFilters(prev => ({ ...prev, bairro: e.target.value }))}
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
                                  {store.logradouro} • {store.cidade}, {store.uf}
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
                                  <div className="text-sm text-blue-600">{store.logradouro} • {store.cidade}, {store.uf}</div>
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

        {/* Filtros */}
        <div className="bg-white rounded-lg border p-4 space-y-4 mb-6">
          <h3 className="font-medium text-gray-900">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Data Criação De</label>
              <Input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters(prev => ({ ...prev, dataInicio: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Data Criação Até</label>
              <Input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters(prev => ({ ...prev, dataFim: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Instalação Prevista De</label>
              <Input
                type="date"
                value={filters.dataPrevistaInicio}
                onChange={(e) => setFilters(prev => ({ ...prev, dataPrevistaInicio: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Instalação Prevista Até</label>
              <Input
                type="date"
                value={filters.dataPrevistaFim}
                onChange={(e) => setFilters(prev => ({ ...prev, dataPrevistaFim: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Com Chamados</label>
              <Select
                value={filters.comChamados}
                onValueChange={(value) => setFilters(prev => ({ ...prev, comChamados: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sim">Com Chamados</SelectItem>
                  <SelectItem value="nao">Sem Chamados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Código da Loja</label>
              <Input
                placeholder="Ex: 12345"
                value={filters.codigoLoja}
                onChange={(e) => setFilters(prev => ({ ...prev, codigoLoja: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Cidade</label>
              <Input
                placeholder="Ex: São Paulo"
                value={filters.cidade}
                onChange={(e) => setFilters(prev => ({ ...prev, cidade: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Bairro</label>
              <Input
                placeholder="Ex: Vila Olímpia"
                value={filters.bairro}
                onChange={(e) => setFilters(prev => ({ ...prev, bairro: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Estado</label>
              <Select
                value={filters.uf}
                onValueChange={(value) => setFilters(prev => ({ ...prev, uf: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="AL">AL</SelectItem>
                  <SelectItem value="AP">AP</SelectItem>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="DF">DF</SelectItem>
                  <SelectItem value="ES">ES</SelectItem>
                  <SelectItem value="GO">GO</SelectItem>
                  <SelectItem value="MA">MA</SelectItem>
                  <SelectItem value="MT">MT</SelectItem>
                  <SelectItem value="MS">MS</SelectItem>
                  <SelectItem value="MG">MG</SelectItem>
                  <SelectItem value="PA">PA</SelectItem>
                  <SelectItem value="PB">PB</SelectItem>
                  <SelectItem value="PR">PR</SelectItem>
                  <SelectItem value="PE">PE</SelectItem>
                  <SelectItem value="PI">PI</SelectItem>
                  <SelectItem value="RJ">RJ</SelectItem>
                  <SelectItem value="RN">RN</SelectItem>
                  <SelectItem value="RS">RS</SelectItem>
                  <SelectItem value="RO">RO</SelectItem>
                  <SelectItem value="RR">RR</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="SP">SP</SelectItem>
                  <SelectItem value="SE">SE</SelectItem>
                  <SelectItem value="TO">TO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => setFilters({
                  dataInicio: '',
                  dataFim: '',
                  comChamados: 'todos',
                  codigoLoja: '',
                  cidade: '',
                  bairro: '',
                  uf: 'todos',
                  dataPrevistaInicio: '',
                  dataPrevistaFim: ''
                })}
                className="text-sm"
              >
                Limpar Filtros
              </Button>
            </div>
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
                          <div className="flex items-center gap-2">
                            {getStatusBadge(route.status)}
                            {route.total_chamados_abertos && route.total_chamados_abertos > 0 && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                                Chamado
                              </Badge>
                            )}
                            {route.total_lojas_instaladas && route.total_lojas_instaladas > 0 && (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                                Lojas Instaladas: {route.total_lojas_instaladas}
                              </Badge>
                            )}
                          </div>
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
                          {route.status === 'ativa' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                finishRouteMutation.mutate(route.id);
                              }}
                              disabled={finishRouteMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Finalizar Rota
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRouteToEdit(route);
                              // Extrair texto das observações se for JSON
                              let observacoesText = '';
                              if (route.observacoes) {
                                try {
                                  const parsed = JSON.parse(route.observacoes);
                                  if (parsed.general) {
                                    observacoesText = parsed.general;
                                  } else {
                                    observacoesText = route.observacoes;
                                  }
                                } catch {
                                  observacoesText = route.observacoes;
                                }
                              }
                              setEditRouteForm({
                                nome: route.nome,
                                status: route.status,
                                data_prevista: route.data_prevista ? new Date(route.data_prevista).toISOString().split('T')[0] : '',
                                observacoes: observacoesText
                              });
                              // Reset estados de edição
                              setEditSelectedSupplier(null);
                              setEditSelectedStores([]);
                              setEditSelectedEmployees([]);
                              setEditSupplierSearch("");
                              setEditStoreFilters({ cidade: "", bairro: "", uf: "", nome_loja: "" });
                              setCurrentRouteStores([]);
                              setShowEditDialog(true);
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
                              setRouteToDelete(route);
                              setShowDeleteDialog(true);
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
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Resumo Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                {routeStats ? (
                  <div className="space-y-4">
                    {/* Mini Dashboard */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                          <div>
                            <div className="text-2xl font-bold text-green-700">{routeStats.rotasFinalizadas}</div>
                            <div className="text-sm text-green-600">Rotas Finalizadas</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Activity className="h-8 w-8 text-blue-600 mr-3" />
                          <div>
                            <div className="text-2xl font-bold text-blue-700">{routeStats.rotasAtivas}</div>
                            <div className="text-sm text-blue-600">Rotas Ativas</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="h-8 w-8 text-emerald-600 mr-3" />
                          <div>
                            <div className="text-2xl font-bold text-emerald-700">{routeStats.lojasFinalizadas}</div>
                            <div className="text-sm text-emerald-600">Lojas Finalizadas</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <XCircle className="h-8 w-8 text-red-600 mr-3" />
                          <div>
                            <div className="text-2xl font-bold text-red-700">{routeStats.lojasNaoFinalizadas}</div>
                            <div className="text-sm text-red-600">Lojas Não Finalizadas</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Carregando estatísticas...</p>
                  </div>
                )}
                {selectedRoute && (
                  <div className="space-y-4 mt-6 pt-6 border-t">
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
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog de Edição */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Rota</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Informações Básicas da Rota */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Rota</label>
                  <Input
                    value={editRouteForm.nome}
                    onChange={(e) => setEditRouteForm({...editRouteForm, nome: e.target.value})}
                    placeholder="Nome da rota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={editRouteForm.status} onValueChange={(value) => setEditRouteForm({...editRouteForm, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="inativa">Inativa</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Data Prevista</label>
                <Input
                  type="date"
                  value={editRouteForm.data_prevista}
                  onChange={(e) => setEditRouteForm({...editRouteForm, data_prevista: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <Textarea
                  value={editRouteForm.observacoes}
                  onChange={(e) => setEditRouteForm({...editRouteForm, observacoes: e.target.value})}
                  placeholder="Observações sobre a rota"
                />
              </div>

              {/* Edição de Fornecedor */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Alterar Fornecedor</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, CNPJ ou CPF..."
                    className="pl-10"
                    value={editSupplierSearch}
                    onChange={(e) => setEditSupplierSearch(e.target.value)}
                  />
                </div>
                
                {editSuppliers && editSuppliers.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border rounded-lg">
                    {editSuppliers.map(supplier => (
                      <div
                        key={supplier.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                          editSelectedSupplier?.id === supplier.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => {
                          setEditSelectedSupplier(supplier);
                          setEditSupplierSearch(supplier.nome_fornecedor);
                          setEditSelectedEmployees([]);
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
                
                {editSelectedSupplier && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-green-800">{editSelectedSupplier.nome_fornecedor}</div>
                        <div className="text-sm text-green-600">Novo fornecedor selecionado</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditSelectedSupplier(null);
                          setEditSupplierSearch("");
                          setEditSelectedEmployees([]);
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Edição de Funcionários */}
              {editSelectedSupplier && (
                <div className="space-y-4">
                  <h3 className="font-medium">Funcionários do Novo Fornecedor</h3>
                  {editEmployees && editEmployees.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Selecione um ou mais funcionários:</div>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {editEmployees.map(employee => (
                          <label key={employee.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              className="mr-3 rounded"
                              checked={editSelectedEmployees.some(e => e.id === employee.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditSelectedEmployees(prev => [...prev, employee]);
                                } else {
                                  setEditSelectedEmployees(prev => prev.filter(emp => emp.id !== employee.id));
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
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm text-yellow-800">Nenhum funcionário cadastrado para este fornecedor.</div>
                    </div>
                  )}
                </div>
              )}

              {/* Edição de Lojas */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Gerenciar Lojas da Rota</h3>
                
                {/* Lojas Atuais da Rota */}
                {currentRouteStores.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">Lojas Atuais da Rota ({currentRouteStores.length})</div>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {currentRouteStores.map(store => (
                        <div key={store.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div>
                            <div className="font-medium text-green-800">{store.nome_loja}</div>
                            <div className="text-sm text-green-600">
                              {store.codigo_loja} • {store.logradouro}, {store.cidade} - {store.uf}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentRouteStores(prev => prev.filter(s => s.id !== store.id))}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Campos de Busca para Adicionar Novas Lojas */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Adicionar Novas Lojas</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Nome da Loja</label>
                      <Input
                        placeholder="Ex: HELP!"
                        value={editStoreFilters.nome_loja}
                        onChange={(e) => setEditStoreFilters(prev => ({ ...prev, nome_loja: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Cidade</label>
                      <Input
                        placeholder="Ex: São Paulo"
                        value={editStoreFilters.cidade}
                        onChange={(e) => setEditStoreFilters(prev => ({ ...prev, cidade: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Bairro</label>
                      <Input
                        placeholder="Ex: Vila Olímpia"
                        value={editStoreFilters.bairro}
                        onChange={(e) => setEditStoreFilters(prev => ({ ...prev, bairro: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Estado</label>
                      <Input
                        placeholder="Ex: SP"
                        value={editStoreFilters.uf}
                        onChange={(e) => setEditStoreFilters(prev => ({ ...prev, uf: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Resultados da Busca para Adicionar */}
                  {editFilteredStores && editFilteredStores.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-700">Lojas Disponíveis ({editFilteredStores.length})</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newStores = editFilteredStores.filter(store => 
                              !editSelectedStores.find(s => s.id === store.id) && 
                              !currentRouteStores.find(s => s.id === store.id)
                            );
                            setEditSelectedStores(prev => [...prev, ...newStores]);
                          }}
                        >
                          Adicionar Todas
                        </Button>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {editFilteredStores.map(store => {
                          const isAlreadyInRoute = currentRouteStores.some(s => s.id === store.id);
                          const isAlreadySelected = editSelectedStores.some(s => s.id === store.id);
                          const isDisabled = isAlreadyInRoute || isAlreadySelected;
                          
                          return (
                            <div key={store.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                              <div>
                                <div className="font-medium">{store.nome_loja}</div>
                                <div className="text-sm text-gray-600">
                                  {store.codigo_loja} • {store.logradouro}, {store.cidade} - {store.uf}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (!isDisabled) {
                                    setEditSelectedStores(prev => [...prev, store]);
                                  }
                                }}
                                disabled={isDisabled}
                              >
                                {isAlreadyInRoute ? 'Já na Rota' : isAlreadySelected ? 'Selecionada' : 'Adicionar'}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Lojas Selecionadas para Adicionar */}
                  {editSelectedStores.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <div className="text-sm font-medium text-gray-700">Novas Lojas para Adicionar ({editSelectedStores.length})</div>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {editSelectedStores.map(store => (
                          <div key={store.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div>
                              <div className="font-medium text-blue-800">{store.nome_loja}</div>
                              <div className="text-sm text-blue-600">
                                {store.codigo_loja} • {store.logradouro}, {store.cidade} - {store.uf}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditSelectedStores(prev => prev.filter(s => s.id !== store.id))}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
                <Button 
                  onClick={() => {
                    const updatedData = {
                      ...editRouteForm,
                      fornecedor_id: editSelectedSupplier?.id,
                      funcionarios: editSelectedEmployees.map(emp => emp.id),
                      currentStores: currentRouteStores.map(store => store.codigo_loja),
                      newStores: editSelectedStores.map(store => store.codigo_loja)
                    };
                    editRouteMutation.mutate(updatedData);
                  }} 
                  disabled={editRouteMutation.isPending}
                >
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Tem certeza que deseja excluir a rota "{routeToDelete?.nome}"?</p>
              <p className="text-sm text-red-600">Esta ação não pode ser desfeita.</p>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
                <Button 
                  variant="destructive" 
                  onClick={() => routeToDelete && confirmDeleteMutation.mutate(routeToDelete.id)}
                  disabled={confirmDeleteMutation.isPending}
                >
                  Excluir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}