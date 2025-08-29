import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./mysql-storage";
import * as fs from "fs";
import * as path from "path";
import multer from "multer";
import { testConnection } from "./mysql-db";
import { 
  insertSupplierSchema, 
  insertSupplierEmployeeSchema,
  insertStoreSchema, 
  insertTicketSchema, 
  insertKitSchema, 
  insertAdminSchema,
  insertInstallationSchema,
  cnpjSearchSchema,
  storeFilterSchema,
  insertRouteSchema,
  insertRouteItemSchema
} from "../shared/mysql-schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const multerStorage = multer.memoryStorage();
  const upload = multer({ 
    storage: multerStorage,
    limits: { 
      fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas imagens são permitidas'));
      }
    }
  });

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

  // ===================== ROTAS =====================

  // Criar nova rota
  app.post('/api/routes', async (req, res) => {
    try {
      const routeData = insertRouteSchema.parse(req.body);
      const route = await storage.createRoute(routeData);
      res.json(route);
    } catch (error: any) {
      console.log('Erro ao criar rota:', error);
      res.status(400).json({ error: 'Dados da rota inválidos' });
    }
  });

  // Listar rotas
  app.get('/api/routes', async (req, res) => {
    try {
      const fornecedorId = req.query.fornecedor_id ? parseInt(req.query.fornecedor_id as string) : undefined;
      const routes = await storage.getRoutes(fornecedorId);
      res.json(routes);
    } catch (error) {
      console.log('Erro ao buscar rotas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar rota por ID com itens
  app.get('/api/routes/:id', async (req, res) => {
    try {
      const routeId = parseInt(req.params.id);
      const route = await storage.getRouteById(routeId);
      
      if (!route) {
        return res.status(404).json({ error: 'Rota não encontrada' });
      }
      
      const items = await storage.getRouteItems(routeId);
      res.json({ ...route, items });
    } catch (error) {
      console.log('Erro ao buscar rota:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar detalhes completos da rota com status das lojas
  app.get('/api/routes/:id/details', async (req, res) => {
    try {
      const routeId = parseInt(req.params.id);
      const routeDetails = await storage.getRouteDetailsWithStatus(routeId);
      
      if (!routeDetails) {
        return res.status(404).json({ error: 'Rota não encontrada' });
      }
      
      res.json(routeDetails);
    } catch (error) {
      console.log('Erro ao buscar detalhes da rota:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Atualizar rota
  app.put('/api/routes/:id', async (req, res) => {
    try {
      const routeId = parseInt(req.params.id);
      const routeData = insertRouteSchema.partial().parse(req.body);
      const route = await storage.updateRoute(routeId, routeData);
      res.json(route);
    } catch (error) {
      console.log('Erro ao atualizar rota:', error);
      res.status(400).json({ error: 'Dados da rota inválidos' });
    }
  });

  // Deletar rota
  app.delete('/api/routes/:id', async (req, res) => {
    try {
      const routeId = parseInt(req.params.id);
      await storage.deleteRoute(routeId);
      res.json({ success: true });
    } catch (error) {
      console.log('Erro ao deletar rota:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Finalizar rota
  app.patch('/api/routes/:id/finish', async (req, res) => {
    try {
      const routeId = parseInt(req.params.id);
      await storage.finishRoute(routeId);
      res.json({ success: true, message: 'Rota finalizada com sucesso' });
    } catch (error) {
      console.log('Erro ao finalizar rota:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para estatísticas das rotas
  app.get('/api/routes/stats', async (req, res) => {
    try {
      const stats = await storage.getRouteStats();
      res.json(stats);
    } catch (error) {
      console.log('Erro ao buscar estatísticas das rotas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Criar item de rota
  app.post('/api/routes/:id/items', async (req, res) => {
    try {
      const routeId = parseInt(req.params.id);
      const itemData = { ...req.body, rota_id: routeId };
      const validatedItem = insertRouteItemSchema.parse(itemData);
      const item = await storage.createRouteItem(validatedItem);
      res.json(item);
    } catch (error) {
      console.log('Erro ao adicionar item à rota:', error);
      res.status(400).json({ error: 'Dados do item inválidos' });
    }
  });

  // Listar itens de uma rota
  app.get('/api/routes/:id/items', async (req, res) => {
    try {
      const routeId = parseInt(req.params.id);
      const items = await storage.getRouteItems(routeId);
      res.json(items);
    } catch (error) {
      console.log('Erro ao buscar itens da rota:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Atualizar item de rota
  app.put('/api/route-items/:id', async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const itemData = insertRouteItemSchema.partial().parse(req.body);
      const item = await storage.updateRouteItem(itemId, itemData);
      res.json(item);
    } catch (error) {
      console.log('Erro ao atualizar item da rota:', error);
      res.status(400).json({ error: 'Dados do item inválidos' });
    }
  });

  // Deletar item de rota
  app.delete('/api/route-items/:id', async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await storage.deleteRouteItem(itemId);
      res.json({ success: true });
    } catch (error) {
      console.log('Erro ao deletar item da rota:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar fornecedores
  app.get('/api/suppliers/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const suppliers = await storage.searchSuppliers(query);
      res.json(suppliers);
    } catch (error) {
      console.log('Erro ao buscar fornecedores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar lojas
  app.get('/api/stores/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const stores = await storage.searchStores(query);
      res.json(stores);
    } catch (error) {
      console.log('Erro ao buscar lojas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar funcionários de um fornecedor
  app.get('/api/suppliers/:id/employees', async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const employees = await storage.getSupplierEmployees(supplierId);
      res.json(employees);
    } catch (error) {
      console.log('Erro ao buscar funcionários:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar lojas por filtros específicos
  app.get('/api/stores/filter', async (req, res) => {
    try {
      const { codigo_loja, cidade, uf, nome_loja } = req.query;
      const stores = await storage.filterStores({
        codigo_loja: codigo_loja as string,
        cidade: cidade as string, 
        uf: uf as string,
        nome_loja: nome_loja as string
      });
      res.json(stores);
    } catch (error) {
      console.log('Erro ao filtrar lojas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
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

  // Endpoint para buscar fornecedor/funcionário por Nome, CPF ou CNPJ
  app.get('/api/suppliers/search', async (req, res) => {
    const query = req.query.q as string;
    
    try {
      const result = await storage.searchSupplierOrEmployee(query);
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: 'Fornecedor ou funcionário não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao buscar fornecedor/funcionário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para buscar rotas por fornecedor
  app.get('/api/routes/supplier/:supplierId', async (req, res) => {
    const supplierId = parseInt(req.params.supplierId);
    
    try {
      const routes = await storage.getRoutesBySupplier(supplierId);
      res.json(routes);
    } catch (error) {
      console.error('Erro ao buscar rotas do fornecedor:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para buscar rotas por funcionário
  app.get('/api/routes/employee/:employeeId', async (req, res) => {
    const employeeId = parseInt(req.params.employeeId);
    
    try {
      const routes = await storage.getRoutesByEmployee(employeeId);
      res.json(routes);
    } catch (error) {
      console.error('Erro ao buscar rotas do funcionário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para buscar lojas por IDs
  app.post('/api/stores/by-ids', async (req, res) => {
    const { storeIds } = req.body;
    
    try {
      const stores = await storage.getStoresByIds(storeIds);
      res.json(stores);
    } catch (error) {
      console.error('Erro ao buscar lojas por IDs:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
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

  // Supplier Employees endpoints
  app.get("/api/suppliers/:id/employees", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const employees = await storage.getSupplierEmployees(supplierId);
      res.json(employees);
    } catch (error) {
      console.error("Erro ao listar funcionários:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/suppliers/:id/employees", async (req, res) => {
    try {
      console.log("Recebendo dados do funcionário:", req.body);
      const supplierId = parseInt(req.params.id);
      const employeeData = {
        ...req.body,
        fornecedor_id: supplierId
      };
      console.log("Dados processados do funcionário:", employeeData);
      
      const employee = await storage.createSupplierEmployee(employeeData);
      console.log("Funcionário criado com sucesso:", employee);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Erro ao criar funcionário:", error);
      res.status(400).json({ error: "Erro ao criar funcionário" });
    }
  });

  app.delete("/api/supplier-employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupplierEmployee(id);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao excluir funcionário:", error);
      res.status(400).json({ error: "Erro ao excluir funcionário" });
    }
  });

  // Employee counts endpoint
  app.get("/api/suppliers/employee-counts", async (req, res) => {
    try {
      const counts = await storage.getSupplierEmployeeCounts();
      res.json(counts);
    } catch (error) {
      console.error("Erro ao buscar contagem de funcionários:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
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

  // Store search with GET method and query parameters
  app.get("/api/stores/search", async (req, res) => {
    try {
      const filters = {
        cep: req.query.cep as string || "",
        address: req.query.address as string || "",
        state: req.query.state as string || "",
        city: req.query.city as string || "",
        code: req.query.code as string || "",
      };
      
      console.log("Filtros de busca recebidos na rota:", filters);
      
      const stores = await storage.getStoresByFilters(filters);
      
      console.log("Lojas encontradas:", stores.length);
      
      if (stores.length === 0) {
        return res.status(404).json({ error: "Loja não encontrada" });
      }
      
      res.json(stores);
    } catch (error) {
      console.error("Erro na busca de lojas:", error);
      res.status(500).json({ error: "Erro na busca de lojas" });
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

  // Update kit usage (sim/nao counters)
  app.patch("/api/kits/:id/usage", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { action } = req.body; // 'sim' or 'nao'
      
      if (!['sim', 'nao'].includes(action)) {
        return res.status(400).json({ error: "Ação deve ser 'sim' ou 'nao'" });
      }
      
      const kit = await storage.updateKitUsage(id, action);
      res.json(kit);
    } catch (error) {
      console.error("Erro ao atualizar uso do kit:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Create new kit
  app.post("/api/kits", async (req, res) => {
    try {
      const kit = await storage.createKit(req.body);
      res.status(201).json(kit);
    } catch (error) {
      console.error("Erro ao criar kit:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Update kit
  app.put("/api/kits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const kit = await storage.updateKit(id, req.body);
      res.json(kit);
    } catch (error) {
      console.error("Erro ao atualizar kit:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Delete kit
  app.delete("/api/kits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteKit(id);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar kit:", error);
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
      const ticket = await storage.createTicket({
        ...ticketData,
        fornecedor_id: ticketData.fornecedor_id || 0
      });
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

  // Buscar instalação existente por loja_id
  app.get("/api/installations/store/:loja_id", async (req, res) => {
    try {
      const { loja_id } = req.params;
      const installation = await storage.getInstallationByStoreId(loja_id);
      res.json(installation);
    } catch (error) {
      console.error("Erro ao buscar instalação por loja:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/installations", async (req, res) => {
    try {
      const installationData = insertInstallationSchema.parse(req.body);
      
      // Verificar se já existe instalação para esta loja
      const existingInstallation = await storage.getInstallationByStoreId(installationData.loja_id);
      
      let installation;
      if (existingInstallation) {
        // Atualizar instalação existente
        installation = await storage.updateInstallation(existingInstallation.id, installationData);
        console.log(`Instalação atualizada para loja ${installationData.loja_id}`);
      } else {
        // Criar nova instalação
        installation = await storage.createInstallation(installationData);
        console.log(`Nova instalação criada para loja ${installationData.loja_id}`);
      }
      
      res.status(201).json(installation);
    } catch (error) {
      console.error("Erro ao criar/atualizar instalação:", error);
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
      res.status(400).json({ error: "Erro ao excluir fornecedor" });
    }
  });

  // Get store installation status
  app.get("/api/stores/:codigo_loja/installation-status", async (req, res) => {
    try {
      const codigo_loja = req.params.codigo_loja;
      const status = await storage.getStoreInstallationStatus(codigo_loja);
      res.json(status);
    } catch (error) {
      console.error("Erro ao buscar status da instalação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Get store complete info with installation status
  app.get("/api/stores/:codigo_loja/complete-info", async (req, res) => {
    try {
      const codigo_loja = req.params.codigo_loja;
      const storeInfo = await storage.getStoreCompleteInfo(codigo_loja);
      if (!storeInfo) {
        return res.status(404).json({ error: "Loja não encontrada" });
      }
      res.json(storeInfo);
    } catch (error) {
      console.error("Erro ao buscar informações completas da loja:", error);
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

  // Simple image upload endpoint using multer
  app.post("/api/upload-image", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      console.log("Uploading file:", req.file.originalname);
      
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      // Get upload URL
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      // Upload file to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        headers: {
          'Content-Type': req.file.mimetype,
        },
        body: req.file.buffer,
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload to storage failed: ${uploadResponse.statusText}`);
      }
      
      console.log("File uploaded successfully to object storage");
      
      // Extract object path from upload URL for serving
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      
      // Return both the storage URL and normalized path
      res.json({ 
        imageURL: uploadURL,
        objectPath: objectPath,
        success: true 
      });
      
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        error: "Falha no upload", 
        details: (error as Error).message 
      });
    }
  });

  // Endpoint to serve object storage images
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      res.status(404).json({ error: "Imagem não encontrada" });
    }
  });

  // Test endpoint to verify object storage
  app.post("/api/test-upload", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      // Test the URL with a simple fetch
      const testResponse = await fetch(uploadURL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'test content'
      });
      
      res.json({ 
        uploadURL,
        testStatus: testResponse.status,
        testStatusText: testResponse.statusText,
        success: testResponse.ok
      });
    } catch (error) {
      console.error("Test upload error:", error);
      res.status(500).json({ error: "Test failed", details: (error as Error).message });
    }
  });

  // Object storage image update endpoint for kits
  app.put("/api/kits/:id/image", async (req, res) => {
    try {
      const { id } = req.params;
      const { imageURL } = req.body;

      if (!imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      // Set ACL policy for public kit images
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        imageURL,
        {
          owner: "admin", // Kit images are managed by admin
          visibility: "public", // Kit images should be publicly accessible
        }
      );

      // Update kit with the normalized object path
      const updatedKit = await storage.updateKit(parseInt(id), { image_url: objectPath });
      
      if (!updatedKit) {
        return res.status(404).json({ error: "Kit not found" });
      }

      res.json({
        kit: updatedKit,
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error updating kit image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve objects endpoint
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof Error && error.constructor.name === "ObjectNotFoundError") {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Download page
  app.get("/download", (req, res) => {
    try {
      const downloadPage = fs.readFileSync(path.join(process.cwd(), 'download.html'), 'utf8');
      res.send(downloadPage);
    } catch (error) {
      console.error("Error serving download page:", error);
      res.status(500).send("Erro ao carregar página de download");
    }
  });

  // Download file endpoint
  app.get("/download-file", (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'sistema-gestao-franquias-hostinger.tar.gz');
      
      // Verificar se arquivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).send("Arquivo não encontrado");
      }
      
      res.download(filePath, 'sistema-gestao-franquias-hostinger.tar.gz', (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          res.status(500).send("Erro ao baixar arquivo");
        }
      });
    } catch (error) {
      console.error("Error serving download file:", error);
      res.status(500).send("Arquivo não encontrado");
    }
  });

  return createServer(app);
}