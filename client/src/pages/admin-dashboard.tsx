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
                Dashboard Administrativo
              </h1>
              <p className="text-gray-600">Visão geral completa da plataforma de franquias</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="h-4 w-4" />
              <span>Atualizado agora</span>
            </div>
          </div>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Lojas</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.totalStores || 0}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12% este mês
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fornecedores</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.totalSuppliers || 0}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                +5% este mês
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Chamados Abertos</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.openTickets || 0}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-orange-600">
                <Clock className="h-4 w-4 mr-1" />
                Requer atenção
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Instalações</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.completedInstallations || 0}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <Check className="h-4 w-4 mr-1" />
                Concluídas
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
          <Link href="/admin/suppliers">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg group">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Gerenciar</p>
                  <p className="font-semibold text-gray-900">Fornecedores</p>
                  <ChevronRight className="h-4 w-4 text-gray-400 mt-2 group-hover:text-blue-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/stores">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg group">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Gerenciar</p>
                  <p className="font-semibold text-gray-900">Lojas</p>
                  <ChevronRight className="h-4 w-4 text-gray-400 mt-2 group-hover:text-green-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/tickets">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg group">
              <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-500 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Gerenciar</p>
                  <p className="text-lg font-semibold text-gray-900">Chamados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/routes">
          <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg group">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Gerenciar</p>
                <p className="font-semibold text-gray-900">Rotas</p>
                <ChevronRight className="h-4 w-4 text-gray-400 mt-2 group-hover:text-indigo-600 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/settings">
          <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg group">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Configurações</p>
                <p className="font-semibold text-gray-900">Sistema</p>
                <ChevronRight className="h-4 w-4 text-gray-400 mt-2 group-hover:text-purple-600 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Total de Lojas</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics?.totalStores || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Total de Fornecedores</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics?.totalSuppliers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Chamados Abertos</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics?.openTickets || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Chamados Resolvidos</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics?.resolvedTickets || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Instalações Concluídas</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics?.completedInstallations || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Kits não Usados</p>
                <p className="text-xl font-bold text-gray-900">
                  {metrics?.unusedKits || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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