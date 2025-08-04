import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./mysql-storage";
import { testConnection } from "./mysql-db";
import { 
  insertSupplierSchema, 
  insertStoreSchema, 
  insertTicketSchema, 
  insertKitSchema, 
  insertAdminSchema,
  insertInstallationSchema,
  cnpjSearchSchema,
  storeFilterSchema
} from "../shared/mysql-schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test MySQL connection
  try {
    await testConnection();
    console.log("✅ MySQL da Hostinger conectado com sucesso!");
  } catch (error) {
    console.error("❌ Falha na conexão com MySQL:", error);
  }

  // Test connection endpoint
  app.get("/api/test-connection", async (req, res) => {
    try {
      const isConnected = await testConnection();
      if (isConnected) {
        res.json({ status: "success", message: "Conexão com MySQL ativa", timestamp: new Date().toISOString() });
      } else {
        res.status(500).json({ status: "error", message: "Falha na conexão com MySQL" });
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: "Erro interno do servidor" });
    }
  });

  // Admin authentication route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, role } = req.body;
      
      if (role === "admin") {
        // Para admin, usa email como username
        const admin = await storage.getAdminByEmail(username);
        
        if (!admin) {
          return res.status(401).json({ error: "Email não encontrado" });
        }
        
        // Verificar senha (simples comparação - em produção usar hash)
        if (admin.senha !== password) {
          return res.status(401).json({ error: "Senha incorreta" });
        }
        
        // Login bem-sucedido
        res.json({ 
          user: { 
            id: admin.id, 
            username: admin.email, 
            role: "admin" 
          }, 
          entity: admin 
        });
      } else {
        // Para outras roles, manter lógica existente
        res.status(400).json({ error: "Role não suportado nesta rota" });
      }
    } catch (error) {
      console.error("Erro na autenticação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Supplier authentication by CNPJ
  app.post("/api/suppliers/auth", async (req, res) => {
    try {
      const { cnpj } = cnpjSearchSchema.parse(req.body);
      
      const supplier = await storage.getSupplierByCnpj(cnpj);
      if (!supplier) {
        return res.status(404).json({ error: "Fornecedor não encontrado" });
      }

      res.json({ success: true, supplier });
    } catch (error) {
      console.error("Erro na autenticação do fornecedor:", error);
      res.status(400).json({ error: "Erro na busca do fornecedor" });
    }
  });

  // Suppliers
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Get supplier by CNPJ (GET route)
  app.get("/api/suppliers/cnpj/:cnpj", async (req, res) => {
    try {
      const cnpj = req.params.cnpj;
      console.log('Recebida requisição GET para CNPJ:', cnpj);
      
      const supplier = await storage.getSupplierByCnpj(cnpj);
      if (!supplier) {
        return res.status(404).json({ error: "Fornecedor não encontrado" });
      }

      res.json(supplier);
    } catch (error) {
      console.error("Erro na busca do fornecedor por CNPJ:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Erro ao criar fornecedor:", error);
      res.status(400).json({ error: "Dados do fornecedor inválidos" });
    }
  });

  // Stores
  app.get("/api/stores", async (req, res) => {
    try {
      const stores = await storage.getAllStores();
      res.json(stores);
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/stores/search", async (req, res) => {
    try {
      const filters = storeFilterSchema.parse(req.body);
      const stores = await storage.getStoresByFilters(filters);
      res.json(stores);
    } catch (error) {
      console.error("Erro na busca de lojas:", error);
      res.status(400).json({ error: "Erro na busca de lojas" });
    }
  });

  app.get("/api/stores/:codigo", async (req, res) => {
    try {
      const store = await storage.getStoreByCode(req.params.codigo);
      
      if (!store) {
        return res.status(404).json({ error: "Loja não encontrada" });
      }
      
      res.json(store);
    } catch (error) {
      console.error("Erro ao buscar loja:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/stores", async (req, res) => {
    try {
      const storeData = insertStoreSchema.parse(req.body);
      const store = await storage.createStore(storeData);
      res.status(201).json(store);
    } catch (error) {
      console.error("Erro ao criar loja:", error);
      res.status(400).json({ error: "Dados da loja inválidos" });
    }
  });

  app.patch("/api/stores/:codigo", async (req, res) => {
    try {
      const codigo_loja = req.params.codigo;
      const updateData = req.body;
      
      console.log("Atualizando loja:", codigo_loja, "com dados:", updateData);
      
      const updatedStore = await storage.updateStore(codigo_loja, updateData);
      res.json(updatedStore);
    } catch (error) {
      console.error("Erro ao atualizar loja:", error);
      res.status(400).json({ error: "Erro ao atualizar loja" });
    }
  });

  app.delete("/api/stores/:codigo", async (req, res) => {
    try {
      const codigo_loja = req.params.codigo;
      
      console.log("Deletando loja:", codigo_loja);
      
      await storage.deleteStore(codigo_loja);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar loja:", error);
      res.status(400).json({ error: "Erro ao deletar loja" });
    }
  });

  // Kits
  app.get("/api/kits", async (req, res) => {
    try {
      const kits = await storage.getAllKits();
      res.json(kits);
    } catch (error) {
      console.error("Erro ao buscar kits:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/kits", async (req, res) => {
    try {
      const kitData = insertKitSchema.parse(req.body);
      const kit = await storage.createKit(kitData);
      res.status(201).json(kit);
    } catch (error) {
      console.error("Erro ao criar kit:", error);
      res.status(400).json({ error: "Dados do kit inválidos" });
    }
  });

  // Tickets
  app.get("/api/tickets", async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Erro ao buscar chamados:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/tickets", async (req, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Erro ao criar chamado:", error);
      res.status(400).json({ error: "Dados do chamado inválidos" });
    }
  });

  // Admins
  app.get("/api/admins", async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      res.json(admins);
    } catch (error) {
      console.error("Erro ao buscar admins:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admins", async (req, res) => {
    try {
      const adminData = insertAdminSchema.parse(req.body);
      const admin = await storage.createAdmin(adminData);
      res.status(201).json(admin);
    } catch (error) {
      console.error("Erro ao criar admin:", error);
      res.status(400).json({ error: "Dados do admin inválidos" });
    }
  });

  // Installations
  app.get("/api/installations", async (req, res) => {
    try {
      const installations = await storage.getAllInstallations();
      res.json(installations);
    } catch (error) {
      console.error("Erro ao buscar instalações:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/installations", async (req, res) => {
    try {
      const installationData = insertInstallationSchema.parse(req.body);
      const installation = await storage.createInstallation(installationData);
      res.status(201).json(installation);
    } catch (error) {
      console.error("Erro ao criar instalação:", error);
      res.status(400).json({ error: "Dados da instalação inválidos" });
    }
  });

  // Dashboard analytics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Erro ao obter métricas:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Additional CRUD endpoints for suppliers
  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.updateSupplier(id, req.body);
      res.json(supplier);
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Additional CRUD endpoints for stores
  app.patch("/api/stores/:codigo_loja", async (req, res) => {
    try {
      const codigo_loja = req.params.codigo_loja;
      const store = await storage.updateStore(codigo_loja, req.body);
      res.json(store);
    } catch (error) {
      console.error("Erro ao atualizar loja:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/stores/:codigo_loja", async (req, res) => {
    try {
      const codigo_loja = req.params.codigo_loja;
      await storage.deleteStore(codigo_loja);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao excluir loja:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Additional endpoints for tickets
  app.patch("/api/tickets/:id/resolve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.resolveTicket(id);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao resolver chamado:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Additional CRUD endpoints for admins
  app.patch("/api/admins/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const admin = await storage.updateAdmin(id, req.body);
      res.json(admin);
    } catch (error) {
      console.error("Erro ao atualizar administrador:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admins/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAdmin(id);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao excluir administrador:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Settings endpoints
  app.post("/api/settings/theme", async (req, res) => {
    try {
      const { primaryColor } = req.body;
      res.json({ success: true, primaryColor });
    } catch (error) {
      console.error("Erro ao atualizar tema:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/settings/logo", async (req, res) => {
    try {
      res.json({ success: true, message: "Logo atualizado com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar logo:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  return createServer(app);
}