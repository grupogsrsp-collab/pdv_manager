import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const ticketFormSchema = z.object({
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  open: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  type: "supplier" | "store";
}

export default function TicketForm({ open, onClose, entityId, entityName, type }: TicketFormProps) {
  const { toast } = useToast();

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      description: "",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      // Get the first available supplier ID for tickets
      let fornecedorId = 1; // Default fallback
      try {
        const suppliersResponse = await fetch('/api/suppliers');
        const suppliers = await suppliersResponse.json();
        const firstSupplier = suppliers[0];
        
        if (type === "supplier") {
          const supplierData = localStorage.getItem("supplier_access");
          const supplier = supplierData ? JSON.parse(supplierData) : null;
          fornecedorId = supplier?.id || firstSupplier?.id || 1;
        } else {
          // For store tickets, use the first available supplier
          fornecedorId = firstSupplier?.id || 1;
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
      
      const payload = {
        loja_id: entityId, // Manter como string conforme esperado pelo backend
        descricao: data.description,
        instalador: "Lojista", // Campo obrigatório
        data_ocorrencia: new Date().toISOString().split('T')[0], // Data atual
        fornecedor_id: fornecedorId,
      };
      
      console.log('Enviando dados do chamado:', payload);
      
      return apiRequest("POST", "/api/tickets", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Chamado Aberto com Sucesso!",
        description: "Seu chamado foi registrado e será atendido em breve.",
        action: (
          <button
            onClick={() => {
              window.location.href = "/store-access"; // Redirecionar para página inicial
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            OK
          </button>
        ),
        duration: 10000,
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar chamado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TicketFormData) => {
    createTicketMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir Chamado</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Entidade:</strong> {entityName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Tipo:</strong> {type === "supplier" ? "Fornecedor" : "Lojista"}
              </p>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Problema</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o problema encontrado..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-4">
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-blue-700"
                disabled={createTicketMutation.isPending}
              >
                Enviar Chamado
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={onClose}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
