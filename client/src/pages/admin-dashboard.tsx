import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, Clock, AlertTriangle, Users, Building2, FileText, Settings, Package, CheckCircle, Plus, Eye, ChevronRight, BarChart3, TrendingUp, Activity, ArrowLeft, MapPin } from "lucide-react";
import DashboardCharts from "@/components/charts/dashboard-charts";
import { Link } from "wouter";

interface DashboardMetrics {
  totalSuppliers: number;
  totalStores: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  completedInstallations: number;
  nonCompletedStores: number;
  unusedKits: number;
  monthlyInstallations: number[];
  ticketsByStatus: { open: number; resolved: number };
  unusedKitsList: any[];
}

export default function AdminDashboard() {
  const [showUnusedKitsDetails, setShowUnusedKitsDetails] = useState(false);
  
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

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
        
        {/* Métricas Principais - Design Executivo */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Indicadores Principais
          </h2>
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
                  {metrics?.totalStores > 0 
                    ? `${Math.round((metrics.completedInstallations / metrics.totalStores) * 100)}%`
                    : '0%'
                  } Concluído
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500"
                  style={{ 
                    width: metrics?.totalStores > 0 
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


      {/* Charts Section */}
      {metrics && <DashboardCharts metrics={metrics} />}

      {/* Unused Kits Details */}
      {metrics?.unusedKitsList && metrics.unusedKitsList.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Detalhes dos Kits não Usados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.unusedKitsList.slice(0, 6).map((kit: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{kit.nome || `Kit ${kit.id}`}</p>
                      <p className="text-sm text-gray-600">ID: {kit.id}</p>
                      {kit.descricao && (
                        <p className="text-sm text-gray-500 mt-1">{kit.descricao}</p>
                      )}
                    </div>
                    <Badge variant="destructive">Não Usado</Badge>
                  </div>
                </div>
              ))}
            </div>
            {metrics.unusedKitsList.length > 6 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  E mais {metrics.unusedKitsList.length - 6} kits não utilizados...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}