import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Palette, Upload, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Admin, type InsertAdmin } from "@shared/mysql-schema";

export default function AdminSettings() {
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [adminFormData, setAdminFormData] = useState<Partial<InsertAdmin>>({});
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { data: admins, isLoading: loadingAdmins } = useQuery({
    queryKey: ["/api/admins"],
  });

  const createAdminMutation = useMutation({
    mutationFn: (data: InsertAdmin) => apiRequest("/api/admins", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      setIsCreateAdminOpen(false);
      setAdminFormData({});
      toast({ title: "Administrador criado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar administrador", variant: "destructive" });
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: (data: { id: number; admin: Partial<InsertAdmin> }) =>
      apiRequest(`/api/admins/${data.id}`, { method: "PATCH", body: JSON.stringify(data.admin) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      setEditingAdmin(null);
      setAdminFormData({});
      toast({ title: "Administrador atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar administrador", variant: "destructive" });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admins/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      toast({ title: "Administrador excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir administrador", variant: "destructive" });
    },
  });

  const updateThemeMutation = useMutation({
    mutationFn: (data: { primaryColor: string }) => 
      apiRequest("/api/settings/theme", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      // Update CSS custom properties
      document.documentElement.style.setProperty('--primary', primaryColor);
      toast({ title: "Tema atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar tema", variant: "destructive" });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      return apiRequest("/api/settings/logo", { method: "POST", body: formData });
    },
    onSuccess: () => {
      toast({ title: "Logo atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar logo", variant: "destructive" });
    },
  });

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAdmin) {
      updateAdminMutation.mutate({ id: editingAdmin.id, admin: adminFormData });
    } else {
      createAdminMutation.mutate(adminFormData as InsertAdmin);
    }
  };

  const openEditAdminDialog = (admin: Admin) => {
    setEditingAdmin(admin);
    setAdminFormData(admin);
  };

  const resetAdminForm = () => {
    setAdminFormData({});
    setEditingAdmin(null);
    setIsCreateAdminOpen(false);
  };

  const handleColorChange = (color: string) => {
    setPrimaryColor(color);
    updateThemeMutation.mutate({ primaryColor: color });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      uploadLogoMutation.mutate(file);
    }
  };

  const predefinedColors = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", 
    "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>

      <Tabs defaultValue="theme" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="theme" data-testid="tab-theme">
            <Palette className="h-4 w-4 mr-2" />
            Tema e Logo
          </TabsTrigger>
          <TabsTrigger value="admins" data-testid="tab-admins">
            <Users className="h-4 w-4 mr-2" />
            Administradores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalização do Tema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Cor Principal</Label>
                <p className="text-sm text-gray-600 mb-4">Escolha a cor principal da plataforma</p>
                
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-16 h-16 rounded-lg border-2 transition-all ${
                        primaryColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      data-testid={`color-option-${color}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-16 h-10"
                    data-testid="input-custom-color"
                  />
                  <span className="text-sm text-gray-600">
                    Cor atual: {primaryColor}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Logo da Plataforma</Label>
                <p className="text-sm text-gray-600 mb-4">Upload do logo (PNG, JPG, SVG)</p>
                
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="max-w-xs"
                    data-testid="input-logo-upload"
                  />
                  <Button
                    onClick={() => document.querySelector<HTMLInputElement>('[data-testid="input-logo-upload"]')?.click()}
                    variant="outline"
                    disabled={uploadLogoMutation.isPending}
                    data-testid="button-upload-logo"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadLogoMutation.isPending ? "Enviando..." : "Escolher Arquivo"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Gerenciar Administradores</CardTitle>
                <Dialog open={isCreateAdminOpen} onOpenChange={setIsCreateAdminOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-admin">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Administrador</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAdminSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                          id="nome"
                          data-testid="input-admin-name"
                          value={adminFormData.nome || ""}
                          onChange={(e) => setAdminFormData({ ...adminFormData, nome: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          data-testid="input-admin-email"
                          value={adminFormData.email || ""}
                          onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="senha">Senha</Label>
                        <Input
                          id="senha"
                          type="password"
                          data-testid="input-admin-password"
                          value={adminFormData.senha || ""}
                          onChange={(e) => setAdminFormData({ ...adminFormData, senha: e.target.value })}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" data-testid="button-save-admin" disabled={createAdminMutation.isPending}>
                          {createAdminMutation.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                        <Button type="button" variant="outline" onClick={resetAdminForm}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAdmins ? (
                <div>Carregando administradores...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins?.map((admin: Admin) => (
                      <TableRow key={admin.id}>
                        <TableCell data-testid={`text-admin-name-${admin.id}`}>{admin.nome}</TableCell>
                        <TableCell data-testid={`text-admin-email-${admin.id}`}>{admin.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditAdminDialog(admin)}
                              data-testid={`button-edit-admin-${admin.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteAdminMutation.mutate(admin.id)}
                              data-testid={`button-delete-admin-${admin.id}`}
                              disabled={deleteAdminMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Admin Dialog */}
      <Dialog open={!!editingAdmin} onOpenChange={() => setEditingAdmin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Administrador</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={adminFormData.nome || ""}
                onChange={(e) => setAdminFormData({ ...adminFormData, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={adminFormData.email || ""}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-senha">Nova Senha (deixe em branco para manter)</Label>
              <Input
                id="edit-senha"
                type="password"
                value={adminFormData.senha || ""}
                onChange={(e) => setAdminFormData({ ...adminFormData, senha: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={updateAdminMutation.isPending}>
                {updateAdminMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="outline" onClick={resetAdminForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}