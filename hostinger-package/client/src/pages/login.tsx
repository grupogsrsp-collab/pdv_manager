import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Store, Truck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/auth";
import { loginSchema, type LoginRequest } from "@shared/schema";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "supplier",
    },
  });

  const handleRoleSelection = (role: string) => {
    if (role === "supplier") {
      setLocation("/supplier-access");
    } else if (role === "store") {
      setLocation("/store-access");
    } else {
      setSelectedRole(role);
      setShowForm(true);
      form.setValue("role", role as any);
    }
  };

  const onSubmit = async (data: LoginRequest) => {
    try {
      await auth.login(data);
      
      // Redirect based on role
      switch (data.role) {
        case "supplier":
          setLocation("/supplier");
          break;
        case "store":
          setLocation("/store");
          break;
        case "admin":
          setLocation("/admin");
          break;
      }
    } catch (error) {
      toast({
        title: "Erro de Login",
        description: "Credenciais inválidas ou conta não aprovada",
        variant: "destructive",
      });
    }
  };

  const getRoleTitle = () => {
    switch (selectedRole) {
      case "supplier":
        return "Login do Fornecedor";
      case "store":
        return "Login do Lojista";
      case "admin":
        return "Login do Administrador";
      default:
        return "Login";
    }
  };

  const getDemoCredentials = () => {
    switch (selectedRole) {
      case "supplier":
        return { username: "supplier", password: "supplier123" };
      case "store":
        return { username: "store1", password: "store123" };
      case "admin":
        return { username: "rodrigo.aeromodelo@gmail.com", password: "123456" };
      default:
        return { username: "", password: "" };
    }
  };

  if (showForm) {
    const demoCredentials = getDemoCredentials();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
                <Store className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{getRoleTitle()}</h1>
              <p className="text-gray-600 mt-2">Franquias Manager</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{selectedRole === "admin" ? "Email" : "Usuário"}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={selectedRole === "admin" ? "Digite seu email" : "Digite seu usuário"} 
                          type={selectedRole === "admin" ? "email" : "text"}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Digite sua senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="font-medium text-gray-700">Credenciais do banco de dados:</p>
                  <p className="text-gray-600">
                    {selectedRole === "admin" ? "Email" : "Usuário"}: {demoCredentials.username}
                  </p>
                  <p className="text-gray-600">Senha: {demoCredentials.password}</p>
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                    Entrar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Voltar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Franquias Manager</h1>
            <p className="text-gray-600 mt-2">Plataforma de Gerenciamento</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-3" 
              onClick={() => handleRoleSelection("supplier")}
            >
              <Truck className="h-5 w-5" />
              <span>Sou Fornecedor</span>
            </Button>
            
            <Button 
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-3"
              onClick={() => handleRoleSelection("store")}
            >
              <Store className="h-5 w-5" />
              <span>Sou Lojista</span>
            </Button>
            
            <Button 
              variant="outline"
              className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-3"
              onClick={() => handleRoleSelection("admin")}
            >
              <Settings className="h-5 w-5" />
              <span>Administração</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
