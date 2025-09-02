import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, CheckCircle, Clock, AlertTriangle, ArrowLeft, Phone, MapPin, Calendar, Store, User, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { type Ticket } from "@shared/mysql-schema";

export default function AdminTickets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const { toast } = useToast();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["/api/tickets"],
  });

  const resolveTicketMutation = useMutation({
    mutationFn: (ticketId: number) => 
      apiRequest(`/api/tickets/${ticketId}/resolve`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ 
        title: "✅ Chamado finalizado com sucesso!", 
        description: "O chamado foi marcado como resolvido."
      });
      setShowResolveModal(false);
      setSelectedTicket(null);
    },
    onError: () => {
      toast({ 
        title: "Erro ao resolver chamado", 
        description: "Tente novamente em alguns instantes.",
        variant: "destructive" 
      });
    },
  });

  const filteredTickets = tickets?.filter((ticket: Ticket) => {
    const matchesSearch = 
      ticket.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.nome_fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.codigo_loja?.includes(searchTerm) ||
      ticket.nome_loja?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.cidade?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aberto":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Aberto
          </Badge>
        );
      case "resolvido":
        return (
          <Badge variant="default" className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Resolvido
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleResolveClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowResolveModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando chamados...</p>
        </div>
      </div>
    );
  }

  // Contadores de status
  const statusCounts = {
    total: tickets?.length || 0,
    aberto: tickets?.filter((t: Ticket) => t.status === "aberto").length || 0,
    resolvido: tickets?.filter((t: Ticket) => t.status === "resolvido").length || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Painel
              </Button>
            </Link>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Chamados</h1>
              <p className="text-gray-600 mt-2">Acompanhe e resolva os chamados de fornecedores e lojas</p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Chamados</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Chamados Abertos</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.aberto}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Chamados Resolvidos</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.resolvido}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por descrição, fornecedor, loja ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-tickets"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="aberto">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-red-500" />
                      Abertos
                    </div>
                  </SelectItem>
                  <SelectItem value="resolvido">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Resolvidos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Chamados */}
        <Card>
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Lista de Chamados ({filteredTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Título</TableHead>
                    <TableHead className="font-semibold">Nome do Fornecedor</TableHead>
                    <TableHead className="font-semibold">Telefone</TableHead>
                    <TableHead className="font-semibold">Código da Loja</TableHead>
                    <TableHead className="font-semibold">Bairro</TableHead>
                    <TableHead className="font-semibold">Cidade</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket: Ticket) => (
                    <TableRow 
                      key={ticket.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 truncate" data-testid={`text-ticket-title-${ticket.id}`}>
                            {ticket.descricao}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{ticket.nome_fornecedor || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{ticket.telefone_fornecedor || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-gray-700" data-testid={`text-ticket-store-${ticket.id}`}>
                            {ticket.codigo_loja || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700">{ticket.bairro || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{ticket.cidade || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-700">{ticket.uf || '-'}</span>
                      </TableCell>
                      <TableCell data-testid={`status-ticket-${ticket.id}`}>
                        {getStatusBadge(ticket.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700" data-testid={`date-ticket-${ticket.id}`}>
                            {formatDate(ticket.data_abertura)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {ticket.status === "aberto" ? (
                            <Button
                              size="sm"
                              onClick={() => handleResolveClick(ticket)}
                              disabled={resolveTicketMutation.isPending}
                              data-testid={`button-resolve-ticket-${ticket.id}`}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Finalizar
                            </Button>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              ✓ Finalizado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-12 w-12 text-gray-300" />
                          <p className="text-gray-500 text-lg">Nenhum chamado encontrado</p>
                          <p className="text-gray-400 text-sm">Tente ajustar os filtros de busca</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Confirmação para Resolver Chamado */}
        <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Finalizar Chamado
              </DialogTitle>
              <DialogDescription className="pt-4">
                Tem certeza que deseja finalizar este chamado?
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">{selectedTicket?.descricao}</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    {selectedTicket?.nome_fornecedor && (
                      <p>Fornecedor: {selectedTicket.nome_fornecedor}</p>
                    )}
                    {selectedTicket?.codigo_loja && (
                      <p>Loja: {selectedTicket.codigo_loja} - {selectedTicket.nome_loja}</p>
                    )}
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowResolveModal(false)}
                disabled={resolveTicketMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => selectedTicket && resolveTicketMutation.mutate(selectedTicket.id)}
                disabled={resolveTicketMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {resolveTicketMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Finalizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalizar Chamado
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}