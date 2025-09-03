import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, Clock, AlertTriangle, Users, Building2, FileText, Settings, Package, CheckCircle, Plus, Eye, ChevronRight, BarChart3, TrendingUp, Activity, ArrowLeft, MapPin, Download, FileSpreadsheet, Filter, X } from "lucide-react";
import { Link } from "wouter";
import { generatePDFReport, generateExcelReport } from "@/utils/report-generator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardMetrics {
  totalSuppliers: number;
  totalStores: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  completedInstallations: number;
  nonCompletedStores: number;
  unusedKits?: number;
  monthlyInstallations?: number[];
  ticketsByStatus?: { open: number; resolved: number };
  unusedKitsList?: any[];
}

export default function AdminDashboard() {
  const [showUnusedKitsDetails, setShowUnusedKitsDetails] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState<string>("");
  const [selectedCidade, setSelectedCidade] = useState<string>("");
  const [selectedBairro, setSelectedBairro] = useState<string>("");
  const [filteredCidades, setFilteredCidades] = useState<string[]>([]);
  const [filteredBairros, setFilteredBairros] = useState<string[]>([]);
  
  // Buscar localizações para os filtros
  const { data: locations } = useQuery<{
    estados: string[];
    cidades: string[];
    bairros: string[];
  }>({
    queryKey: ["/api/stores/locations"],
  });

  // Buscar métricas com filtros
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: [
      "/api/dashboard/metrics",
      { estado: selectedEstado, cidade: selectedCidade, bairro: selectedBairro }
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEstado) params.append('estado', selectedEstado);
      if (selectedCidade) params.append('cidade', selectedCidade);
      if (selectedBairro) params.append('bairro', selectedBairro);
      
      const response = await fetch(`/api/dashboard/metrics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
  });

  // Filtrar cidades e bairros baseado nas seleções
  useEffect(() => {
    if (locations) {
      // Resetar cidade e bairro quando estado muda
      if (selectedEstado) {
        setSelectedCidade("");
        setSelectedBairro("");
      }
      
      // Por enquanto mostrar todas as cidades e bairros
      // Em produção, filtraríamos baseado no estado/cidade selecionado
      setFilteredCidades(locations.cidades || []);
      setFilteredBairros(locations.bairros || []);
    }
  }, [selectedEstado, locations]);

  const clearFilters = () => {
    setSelectedEstado("");
    setSelectedCidade("");
    setSelectedBairro("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
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
                <Link href="/">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Relatórios Gerenciais
              </h1>
              <p className="text-gray-600">Visão executiva completa para acompanhamento da plataforma</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="h-4 w-4" />
              <span>Atualizado em tempo real</span>
            </div>
          </div>
        </div>
        
        {/* Acessos Rápidos - Módulos do Sistema */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-gray-600" />
            Acessos Rápidos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link href="/admin/suppliers">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/90 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <Users className="h-6 w-6 text-blue-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Fornecedores</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/stores">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/90 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <Building2 className="h-6 w-6 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Lojas</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/tickets">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/90 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <FileText className="h-6 w-6 text-orange-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Chamados</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/kits">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/90 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <Package className="h-6 w-6 text-purple-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Kits</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/routes">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/90 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <MapPin className="h-6 w-6 text-indigo-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Rotas</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/settings">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/90 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <Settings className="h-6 w-6 text-gray-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Configurações</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
        
        {/* Métricas Principais - Design Executivo */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Indicadores Principais
          </h2>
          
          {/* Filtros de Localização */}
          <div className="mb-6">
            <Card className="bg-white/95 border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Filtrar por Região:</span>
                  </div>
                  <div className="flex flex-wrap gap-3 flex-1">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600">Estado</label>
                      <Select value={selectedEstado || "all"} onValueChange={(value) => setSelectedEstado(value === "all" ? "" : value)}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {locations?.estados?.map(estado => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600">Cidade</label>
                      <Select value={selectedCidade || "all"} onValueChange={(value) => setSelectedCidade(value === "all" ? "" : value)} disabled={!filteredCidades.length}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Cidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {filteredCidades?.map(cidade => (
                            <SelectItem key={cidade} value={cidade}>
                              {cidade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600">Bairro</label>
                      <Select value={selectedBairro || "all"} onValueChange={(value) => setSelectedBairro(value === "all" ? "" : value)} disabled={!filteredBairros.length}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Bairro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {filteredBairros?.map(bairro => (
                            <SelectItem key={bairro} value={bairro}>
                              {bairro}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(selectedEstado || selectedCidade || selectedBairro) && (
                      <Button
                        onClick={clearFilters}
                        variant="outline"
                        size="sm"
                        className="text-gray-600"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Limpar Filtros
                      </Button>
                    )}
                  </div>
                </div>
                {(selectedEstado || selectedCidade || selectedBairro) && (
                  <div className="mt-3 text-sm text-gray-600">
                    Exibindo dados filtrados por:
                    {selectedEstado && <span className="ml-2 font-medium">Estado: {selectedEstado}</span>}
                    {selectedCidade && <span className="ml-2 font-medium">Cidade: {selectedCidade}</span>}
                    {selectedBairro && <span className="ml-2 font-medium">Bairro: {selectedBairro}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Total de Lojas */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <Building2 className="h-8 w-8 text-white/80" />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Base</span>
                  </div>
                  <p className="text-sm font-medium text-white/90 mb-1">Total de Lojas</p>
                  <p className="text-3xl font-bold">{metrics?.totalStores || 0}</p>
                  <p className="text-xs text-white/70 mt-2">Cadastradas no sistema</p>
                </div>
              </CardContent>
            </Card>

            {/* Total de Fornecedores */}
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <Users className="h-8 w-8 text-white/80" />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Base</span>
                  </div>
                  <p className="text-sm font-medium text-white/90 mb-1">Total de Fornecedores</p>
                  <p className="text-3xl font-bold">{metrics?.totalSuppliers || 0}</p>
                  <p className="text-xs text-white/70 mt-2">Parceiros ativos</p>
                </div>
              </CardContent>
            </Card>

            {/* Chamados em Aberto */}
            <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <AlertTriangle className="h-8 w-8 text-white/80" />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full animate-pulse">Atenção</span>
                  </div>
                  <p className="text-sm font-medium text-white/90 mb-1">Chamados em Aberto</p>
                  <p className="text-3xl font-bold">{metrics?.openTickets || 0}</p>
                  <p className="text-xs text-white/70 mt-2">Aguardando resolução</p>
                </div>
              </CardContent>
            </Card>

            {/* Chamados Resolvidos */}
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <CheckCircle className="h-8 w-8 text-white/80" />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Sucesso</span>
                  </div>
                  <p className="text-sm font-medium text-white/90 mb-1">Chamados Resolvidos</p>
                  <p className="text-3xl font-bold">{metrics?.resolvedTickets || 0}</p>
                  <p className="text-xs text-white/70 mt-2">Finalizados com êxito</p>
                </div>
              </CardContent>
            </Card>

            {/* Lojas Finalizadas */}
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <Check className="h-8 w-8 text-white/80" />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Meta</span>
                  </div>
                  <p className="text-sm font-medium text-white/90 mb-1">Lojas Finalizadas</p>
                  <p className="text-3xl font-bold">{metrics?.completedInstallations || 0}</p>
                  <p className="text-xs text-white/70 mt-2">Instalações completas</p>
                </div>
              </CardContent>
            </Card>

            {/* Lojas Não Finalizadas */}
            <Card className="bg-gradient-to-br from-gray-600 to-gray-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <Clock className="h-8 w-8 text-white/80" />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Pendente</span>
                  </div>
                  <p className="text-sm font-medium text-white/90 mb-1">Lojas Não Finalizadas</p>
                  <p className="text-3xl font-bold">{metrics?.nonCompletedStores || 0}</p>
                  <p className="text-xs text-white/70 mt-2">Em processo de instalação</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Indicador de Performance */}
        <div className="mb-8">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Taxa de Conclusão
                </h3>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {metrics && metrics.totalStores > 0 
                    ? `${Math.round((metrics.completedInstallations / metrics.totalStores) * 100)}%`
                    : '0%'
                  } Concluído
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500"
                  style={{ 
                    width: metrics && metrics.totalStores > 0 
                      ? `${Math.min((metrics.completedInstallations / metrics.totalStores) * 100, 100)}%`
                      : '0%' 
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>{metrics?.completedInstallations || 0} finalizadas</span>
                <span>{metrics?.nonCompletedStores || 0} pendentes</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Exportação de Relatórios */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-1">
                    <Download className="h-5 w-5 mr-2 text-gray-600" />
                    Exportar Relatórios
                  </h3>
                  <p className="text-sm text-gray-600">Baixe os dados em PDF ou Excel para análise offline</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      if (metrics) {
                        setIsGeneratingReport(true);
                        setTimeout(() => {
                          generatePDFReport({
                            totalSuppliers: metrics.totalSuppliers,
                            totalStores: metrics.totalStores,
                            openTickets: metrics.openTickets,
                            resolvedTickets: metrics.resolvedTickets,
                            completedInstallations: metrics.completedInstallations,
                            nonCompletedStores: metrics.nonCompletedStores
                          }, {
                            estado: selectedEstado,
                            cidade: selectedCidade,
                            bairro: selectedBairro
                          });
                          setIsGeneratingReport(false);
                        }, 100);
                      }
                    }}
                    disabled={isGeneratingReport || !metrics}
                    className="bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isGeneratingReport ? 'Gerando...' : 'Baixar PDF'}
                  </Button>
                  <Button
                    onClick={() => {
                      if (metrics) {
                        setIsGeneratingReport(true);
                        setTimeout(() => {
                          generateExcelReport({
                            totalSuppliers: metrics.totalSuppliers,
                            totalStores: metrics.totalStores,
                            openTickets: metrics.openTickets,
                            resolvedTickets: metrics.resolvedTickets,
                            completedInstallations: metrics.completedInstallations,
                            nonCompletedStores: metrics.nonCompletedStores
                          }, {
                            estado: selectedEstado,
                            cidade: selectedCidade,
                            bairro: selectedBairro
                          });
                          setIsGeneratingReport(false);
                        }, 100);
                      }
                    }}
                    disabled={isGeneratingReport || !metrics}
                    className="bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {isGeneratingReport ? 'Gerando...' : 'Baixar Excel'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>



      </div>
    </div>
  );
}