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
      // Get supplier data from localStorage to get fornecedor_id
      const supplierData = localStorage.getItem("supplier_access");
      const supplier = supplierData ? JSON.parse(supplierData) : null;
      
      return apiRequest("POST", "/api/tickets", {
        descricao: data.description,
        status: "aberto",
        loja_id: parseInt(entityId), // Convert store ID to number
        fornecedor_id: supplier?.id || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Sucesso",
        description: "Chamado criado com sucesso!",
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
