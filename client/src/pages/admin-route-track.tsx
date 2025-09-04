import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Building2, CheckCircle, XCircle, AlertTriangle, Phone, Clock, User } from "lucide-react";
import { Link } from "wouter";

interface RouteStoreStatus {
  id: string;
  codigo_loja: string;
  nome_loja: string;
  cidade: string;
  uf: string;
  logradouro: string;
  telefone_loja: string;
  nome_operador: string;
  status: 'finalizada' | 'pendente' | 'chamado_aberto';
  instalacao_finalizada: boolean;
  tem_chamado_aberto: boolean;
  data_instalacao?: string;
  ultimo_chamado?: string;
}

interface RouteDetails {
  id: number;
  nome: string;
  status: string;
  data_criacao: string;
  data_prevista?: string;
  fornecedor_nome: string;
  fornecedor_telefone?: string;
  fornecedor_email?: string;
  observacoes?: string;
  lojas: RouteStoreStatus[];
  funcionarios: string[];
  instaladores: string[];
}

export default function AdminRouteTrack() {
  const [, params] = useRoute("/admin/routes/:id/track");
  const routeId = params?.id;

  const { data: routeDetails, isLoading } = useQuery<RouteDetails>({
    queryKey: ['/api/routes', routeId, 'details'],
    queryFn: () => fetch(`/api/routes/${routeId}/details`).then(res => res.json()),
    enabled: !!routeId,
  });

  const getStatusIcon = (store: RouteStoreStatus) => {
    if (store.tem_chamado_aberto) {
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    }
    if (store.instalacao_finalizada) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (store: RouteStoreStatus) => {
    if (store.tem_chamado_aberto) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Chamado Aberto</Badge>;
    }
    if (store.instalacao_finalizada) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Finalizada</Badge>;
    }
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Pendente</Badge>;
  };

  const getStatusSummary = (lojas: RouteStoreStatus[]) => {
    const finalizadas = lojas.filter(l => l.instalacao_finalizada && !l.tem_chamado_aberto).length;
    const pendentes = lojas.filter(l => !l.instalacao_finalizada && !l.tem_chamado_aberto).length;
    const chamados = lojas.filter(l => l.tem_chamado_aberto).length;
    
    return { finalizadas, pendentes, chamados, total: lojas.length };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/routes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Carregando...</h1>
        </div>
      </div>
    );
  }

  if (!routeDetails) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/routes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Rota não encontrada</h1>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/routes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{routeDetails.nome}</h1>
            <p className="text-gray-600">Acompanhamento da Rota</p>
          </div>
        </div>
        <Badge variant={routeDetails.status === 'ativa' ? 'default' : 'secondary'}>
          {routeDetails.status === 'ativa' ? 'Ativa' : routeDetails.status}
        </Badge>
      </div>


      {/* Informações da Rota */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Informações da Rota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Fornecedor</p>
              <p className="font-medium">{routeDetails.fornecedor_nome}</p>
            </div>
            {routeDetails.fornecedor_telefone && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Telefone Empresa</p>
                <p className="font-medium">{routeDetails.fornecedor_telefone}</p>
              </div>
            )}
            {routeDetails.fornecedor_email && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">E-mail</p>
                <p className="font-medium">{routeDetails.fornecedor_email}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Data de Criação</p>
              <p className="font-medium">{new Date(routeDetails.data_criacao).toLocaleDateString('pt-BR')}</p>
            </div>
            {routeDetails.data_prevista && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Data Prevista</p>
                <p className="font-medium">{new Date(routeDetails.data_prevista).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
            {routeDetails.funcionarios && routeDetails.funcionarios.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Funcionários</p>
                <p className="font-medium">{routeDetails.funcionarios.join(', ')}</p>
              </div>
            )}
            {routeDetails.instaladores && routeDetails.instaladores.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Instaladores</p>
                <div className="font-medium">
                  {routeDetails.instaladores.map((instalador, index) => (
                    <div key={index}>{instalador}</div>
                  ))}
                </div>
              </div>
            )}
            {routeDetails.observacoes && (
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm font-medium text-gray-600 mb-1">Observações</p>
                <p className="font-medium">{routeDetails.observacoes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Lojas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Lojas da Rota ({routeDetails.lojas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {routeDetails.lojas.map((loja, index) => (
              <div
                key={loja.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(loja)}
                    <div>
                      <h3 className="font-medium">{loja.nome_loja}</h3>
                      <p className="text-sm text-gray-600">
                        {loja.codigo_loja} • {loja.cidade}, {loja.uf}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right hidden md:block">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <User className="h-4 w-4 mr-1" />
                      {loja.nome_operador}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-1" />
                      {loja.telefone_loja}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {getStatusBadge(loja)}
                    {loja.data_instalacao && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(loja.data_instalacao).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}