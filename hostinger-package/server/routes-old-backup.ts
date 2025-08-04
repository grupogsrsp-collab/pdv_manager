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

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.params.id, supplierData);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Invalid supplier data" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    const deleted = await storage.deleteSupplier(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.status(204).send();
  });

  // Stores
  app.get("/api/stores", async (req, res) => {
    const stores = await storage.getAllStores();
    res.json(stores);
  });

  app.get("/api/stores/search", async (req, res) => {
    const filters = {
      cep: req.query.cep as string,
      address: req.query.address as string,
      state: req.query.state as string,
      city: req.query.city as string,
      code: req.query.code as string,
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (!filters[key as keyof typeof filters]) {
        delete filters[key as keyof typeof filters];
      }
    });
    
    const stores = await storage.searchStores(filters);
    res.json(stores);
  });

  app.get("/api/stores/:id", async (req, res) => {
    const store = await storage.getStore(req.params.id);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    res.json(store);
  });

  app.post("/api/stores", async (req, res) => {
    try {
      const storeData = insertStoreSchema.parse(req.body);
      const store = await storage.createStore(storeData);
      res.status(201).json(store);
    } catch (error) {
      res.status(400).json({ message: "Invalid store data" });
    }
  });

  app.put("/api/stores/:id", async (req, res) => {
    try {
      const storeData = insertStoreSchema.partial().parse(req.body);
      const store = await storage.updateStore(req.params.id, storeData);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      res.json(store);
    } catch (error) {
      res.status(400).json({ message: "Invalid store data" });
    }
  });

  app.delete("/api/stores/:id", async (req, res) => {
    const deleted = await storage.deleteStore(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Store not found" });
    }
    res.status(204).send();
  });

  // Complete installation
  app.post("/api/stores/:id/complete-installation", async (req, res) => {
    try {
      const { installerName, installationDate, photos } = req.body;
      const store = await storage.updateStore(req.params.id, {
        installationCompleted: true,
        installerName,
        installationDate: new Date(installationDate),
        photos: photos || [],
      });
      
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      res.json(store);
    } catch (error) {
      res.status(400).json({ message: "Invalid installation data" });
    }
  });

  // Tickets
  app.get("/api/tickets", async (req, res) => {
    const { type, status } = req.query;
    
    let tickets;
    if (type && status) {
      const typeTickets = await storage.getTicketsByType(type as string);
      tickets = typeTickets.filter(ticket => ticket.status === status);
    } else if (type) {
      tickets = await storage.getTicketsByType(type as string);
    } else if (status) {
      tickets = await storage.getTicketsByStatus(status as string);
    } else {
      tickets = await storage.getAllTickets();
    }
    
    res.json(tickets);
  });

  app.post("/api/tickets", async (req, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      res.status(400).json({ message: "Invalid ticket data" });
    }
  });

  app.put("/api/tickets/:id/resolve", async (req, res) => {
    const { resolvedBy } = req.body;
    if (!resolvedBy) {
      return res.status(400).json({ message: "resolvedBy is required" });
    }
    
    const ticket = await storage.resolveTicket(req.params.id, resolvedBy);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    
    res.json(ticket);
  });

  // Kits
  app.get("/api/kits", async (req, res) => {
    const kits = await storage.getAllKits();
    res.json(kits);
  });

  app.get("/api/stores/:storeId/kits", async (req, res) => {
    const kits = await storage.getKitsByStore(req.params.storeId);
    res.json(kits);
  });

  app.post("/api/kits", async (req, res) => {
    try {
      const kitData = insertKitSchema.parse(req.body);
      const kit = await storage.createKit(kitData);
      res.status(201).json(kit);
    } catch (error) {
      res.status(400).json({ message: "Invalid kit data" });
    }
  });

  app.put("/api/kits/:id", async (req, res) => {
    try {
      const kitData = insertKitSchema.partial().parse(req.body);
      const kit = await storage.updateKit(req.params.id, kitData);
      if (!kit) {
        return res.status(404).json({ message: "Kit not found" });
      }
      res.json(kit);
    } catch (error) {
      res.status(400).json({ message: "Invalid kit data" });
    }
  });

  // Admins
  app.get("/api/admins", async (req, res) => {
    const admins = await storage.getAllAdmins();
    res.json(admins);
  });

  app.post("/api/admins", async (req, res) => {
    try {
      const adminData = insertAdminSchema.parse(req.body);
      const admin = await storage.createAdmin(adminData);
      res.status(201).json(admin);
    } catch (error) {
      res.status(400).json({ message: "Invalid admin data" });
    }
  });

  app.put("/api/admins/:id/approve", async (req, res) => {
    const admin = await storage.approveAdmin(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json(admin);
  });

  // Installations
  app.get("/api/installations", async (req, res) => {
    const installations = await storage.getAllInstallations();
    res.json(installations);
  });

  app.post("/api/installations", async (req, res) => {
    try {
      // Handle form data for file uploads
      const { storeId, supplierId, responsibleName, installationDate } = req.body;
      
      const installationData = {
        storeId,
        supplierId,
        responsibleName,
        installationDate: new Date(installationDate),
        photos: [], // For now, we'll store empty array - in production would handle actual files
        status: "completed" as const
      };

      const installation = await storage.createInstallation(installationData);
      res.status(201).json(installation);
    } catch (error) {
      console.error("Installation creation error:", error);
      res.status(400).json({ message: "Invalid installation data" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    const metrics = await storage.getDashboardMetrics();
    res.json(metrics);
  });

  // File upload placeholder (in production, would use proper file handling)
  app.post("/api/upload", async (req, res) => {
    // This is a placeholder for file upload functionality
    // In production, you would use multer or similar library
    res.json({ 
      message: "File upload not implemented in this demo",
      files: req.body.files || []
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
