import express from "express";
import { storage } from './mysql-storage';
import { 
  insertSupplierSchema, 
  insertSupplierEmployeeSchema,
  insertStoreSchema, 
  insertKitSchema, 
  insertTicketSchema, 
  insertAdminSchema, 
  insertFotoFinalSchema,
  insertFotoOriginalLojaSchema, 
  insertInstallationSchema,
  cnpjSearchSchema,
  cpfSearchSchema,
  storeFilterSchema
} from '../shared/mysql-schema';

const router = express.Router();

// Suppliers routes
router.post("/api/suppliers/search", async (req, res) => {
  try {
    const { cnpj } = cnpjSearchSchema.parse(req.body);
    const supplier = await storage.getSupplierByCnpj(cnpj);
    
    if (!supplier) {
      return res.status(404).json({ error: "Fornecedor não encontrado" });
    }
    
    res.json(supplier);
  } catch (error) {
    console.error("Erro ao buscar fornecedor:", error);
    res.status(400).json({ error: "Erro na busca do fornecedor" });
  }
});

router.post("/api/suppliers/search-cpf", async (req, res) => {
  try {
    const { cpf } = cpfSearchSchema.parse(req.body);
    const supplier = await storage.getSupplierByCpf(cpf);
    
    if (!supplier) {
      return res.status(404).json({ error: "Fornecedor não encontrado" });
    }
    
    res.json(supplier);
  } catch (error) {
    console.error("Erro ao buscar fornecedor por CPF:", error);
    res.status(400).json({ error: "Erro na busca do fornecedor" });
  }
});

router.get("/api/suppliers", async (req, res) => {
  try {
    const suppliers = await storage.getAllSuppliers();
    res.json(suppliers);
  } catch (error) {
    console.error("Erro ao listar fornecedores:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/api/suppliers", async (req, res) => {
  try {
    const supplierData = insertSupplierSchema.parse(req.body);
    const supplier = await storage.createSupplier(supplierData);
    res.status(201).json(supplier);
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);
    res.status(400).json({ error: "Erro ao criar fornecedor" });
  }
});

router.patch("/api/suppliers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const supplierData = req.body;
    const supplier = await storage.updateSupplier(id, supplierData);
    res.json(supplier);
  } catch (error) {
    console.error("Erro ao atualizar fornecedor:", error);
    res.status(400).json({ error: "Erro ao atualizar fornecedor" });
  }
});

router.delete("/api/suppliers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteSupplier(id);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir fornecedor:", error);
    res.status(400).json({ error: "Erro ao excluir fornecedor" });
  }
});

// Supplier Employees routes
router.get("/api/suppliers/:id/employees", async (req, res) => {
  try {
    const supplierId = parseInt(req.params.id);
    const employees = await storage.getSupplierEmployees(supplierId);
    res.json(employees);
  } catch (error) {
    console.error("Erro ao listar funcionários:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/api/suppliers/:id/employees", async (req, res) => {
  try {
    const supplierId = parseInt(req.params.id);
    const employeeData = insertSupplierEmployeeSchema.parse({
      ...req.body,
      fornecedor_id: supplierId
    });
    const employee = await storage.createSupplierEmployee(employeeData);
    res.status(201).json(employee);
  } catch (error) {
    console.error("Erro ao criar funcionário:", error);
    res.status(400).json({ error: "Erro ao criar funcionário" });
  }
});

router.patch("/api/supplier-employees/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const employeeData = req.body;
    const employee = await storage.updateSupplierEmployee(id, employeeData);
    res.json(employee);
  } catch (error) {
    console.error("Erro ao atualizar funcionário:", error);
    res.status(400).json({ error: "Erro ao atualizar funcionário" });
  }
});

router.delete("/api/supplier-employees/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteSupplierEmployee(id);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir funcionário:", error);
    res.status(400).json({ error: "Erro ao excluir funcionário" });
  }
});

// Stores routes
router.post("/api/stores/search", async (req, res) => {
  try {
    const filters = storeFilterSchema.parse(req.body);
    const stores = await storage.getStoresByFilters(filters);
    res.json(stores);
  } catch (error) {
    console.error("Erro ao buscar lojas:", error);
    res.status(400).json({ error: "Erro na busca de lojas" });
  }
});

router.get("/api/stores", async (req, res) => {
  try {
    const stores = await storage.getAllStores();
    res.json(stores);
  } catch (error) {
    console.error("Erro ao listar lojas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/api/stores/:codigo", async (req, res) => {
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

router.post("/api/stores", async (req, res) => {
  try {
    const storeData = insertStoreSchema.parse(req.body);
    const store = await storage.createStore(storeData);
    res.status(201).json(store);
  } catch (error) {
    console.error("Erro ao criar loja:", error);
    res.status(400).json({ error: "Erro ao criar loja" });
  }
});

// Kits routes
router.get("/api/kits", async (req, res) => {
  try {
    const kits = await storage.getAllKits();
    res.json(kits);
  } catch (error) {
    console.error("Erro ao listar kits:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/api/kits", async (req, res) => {
  try {
    const kitData = insertKitSchema.parse(req.body);
    const kit = await storage.createKit(kitData);
    res.status(201).json(kit);
  } catch (error) {
    console.error("Erro ao criar kit:", error);
    res.status(400).json({ error: "Erro ao criar kit" });
  }
});

// Tickets routes
router.get("/api/tickets", async (req, res) => {
  try {
    const tickets = await storage.getAllTickets();
    res.json(tickets);
  } catch (error) {
    console.error("Erro ao listar chamados:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/api/tickets", async (req, res) => {
  try {
    const ticketData = insertTicketSchema.parse(req.body);
    const ticket = await storage.createTicket(ticketData);
    res.status(201).json(ticket);
  } catch (error) {
    console.error("Erro ao criar chamado:", error);
    res.status(400).json({ error: "Erro ao criar chamado" });
  }
});

// Admins routes
router.get("/api/admins", async (req, res) => {
  try {
    const admins = await storage.getAllAdmins();
    res.json(admins);
  } catch (error) {
    console.error("Erro ao listar admins:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/api/admins", async (req, res) => {
  try {
    const adminData = insertAdminSchema.parse(req.body);
    const admin = await storage.createAdmin(adminData);
    res.status(201).json(admin);
  } catch (error) {
    console.error("Erro ao criar admin:", error);
    res.status(400).json({ error: "Erro ao criar admin" });
  }
});

// Photos routes
// Fotos Finais (depois da instalação)
router.get("/api/fotos-finais/:loja_id", async (req, res) => {
  try {
    const fotos = await storage.getFotosFinaisByStoreId(req.params.loja_id);
    res.json(fotos);
  } catch (error) {
    console.error("Erro ao listar fotos finais:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/api/fotos-finais", async (req, res) => {
  try {
    const fotoData = insertFotoFinalSchema.parse(req.body);
    const foto = await storage.createFotoFinal(fotoData);
    res.status(201).json(foto);
  } catch (error) {
    console.error("Erro ao criar foto final:", error);
    res.status(400).json({ error: "Erro ao criar foto final" });
  }
});

// Fotos Originais da Loja (antes da instalação)
router.get("/api/fotos-originais/:loja_id", async (req, res) => {
  try {
    const fotos = await storage.getFotosOriginaisByStoreId(req.params.loja_id);
    res.json(fotos);
  } catch (error) {
    console.error("Erro ao listar fotos originais:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/api/fotos-originais", async (req, res) => {
  try {
    const fotoData = insertFotoOriginalLojaSchema.parse(req.body);
    const foto = await storage.createFotoOriginalLoja(fotoData);
    res.status(201).json(foto);
  } catch (error) {
    console.error("Erro ao criar foto original:", error);
    res.status(400).json({ error: "Erro ao criar foto original" });
  }
});

// Installations routes
router.get("/api/installations", async (req, res) => {
  try {
    const installations = await storage.getAllInstallations();
    res.json(installations);
  } catch (error) {
    console.error("Erro ao listar instalações:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/api/installations", async (req, res) => {
  try {
    const installationData = insertInstallationSchema.parse(req.body);
    const installation = await storage.createInstallation(installationData);
    res.status(201).json(installation);
  } catch (error) {
    console.error("Erro ao criar instalação:", error);
    res.status(400).json({ error: "Erro ao criar instalação" });
  }
});

// Dashboard analytics
router.get("/api/dashboard/metrics", async (req, res) => {
  try {
    const metrics = await storage.getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    console.error("Erro ao obter métricas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;