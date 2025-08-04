import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Ticket } from "@shared/mysql-schema";

export default function AdminTickets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["/api/tickets"],
  });

  const resolveTicketMutation = useMutation({
    mutationFn: (ticketId: number) => 
      apiRequest(`/api/tickets/${ticketId}/resolve`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Chamado resolvido com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao resolver chamado", variant: "destructive" });
    },
  });

  const filteredTickets = tickets?.filter((ticket: Ticket) => {
    const matchesSearch = 
      ticket.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.loja_id.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aberto":
        return <Clock className="h-4 w-4" />;
      case "resolvido":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aberto":
        return <Badge variant="destructive">Aberto</Badge>;
      case "resolvido":
        return <Badge variant="default" className="bg-green-500">Resolvido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "supplier":
        return <Badge variant="outline">Fornecedor</Badge>;
      case "store":
        return <Badge variant="secondary">Lojista</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return <div className="p-6">Carregando chamados...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Chamados</h1>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por título, descrição ou código da loja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-tickets"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="resolvido">Resolvido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40" data-testid="select-type-filter">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="supplier">Fornecedor</SelectItem>
            <SelectItem value="store">Lojista</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chamados ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Código da Loja</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket: Ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium" data-testid={`text-ticket-title-${ticket.id}`}>
                        {ticket.titulo}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs" data-testid={`text-ticket-description-${ticket.id}`}>
                        {ticket.descricao}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-ticket-store-${ticket.id}`}>{ticket.codigo_loja}</TableCell>
                  <TableCell>{getTypeBadge(ticket.tipo)}</TableCell>
                  <TableCell data-testid={`status-ticket-${ticket.id}`}>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={ticket.prioridade === "alta" ? "destructive" : ticket.prioridade === "media" ? "default" : "secondary"}
                      data-testid={`priority-ticket-${ticket.id}`}
                    >
                      {ticket.prioridade}
                    </Badge>
                  </TableCell>
                  <TableCell data-testid={`date-ticket-${ticket.id}`}>
                    {formatDate(ticket.data_criacao)}
                  </TableCell>
                  <TableCell>
                    {ticket.status === "aberto" && (
                      <Button
                        size="sm"
                        onClick={() => resolveTicketMutation.mutate(ticket.id)}
                        disabled={resolveTicketMutation.isPending}
                        data-testid={`button-resolve-ticket-${ticket.id}`}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolver
                      </Button>
                    )}
                    {ticket.status === "resolvido" && (
                      <Badge variant="default" className="bg-green-500">
                        ✓ Resolvido
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredTickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum chamado encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}