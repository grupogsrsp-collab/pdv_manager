import { 
  type User, type InsertUser,
  type Supplier, type InsertSupplier,
  type Store, type InsertStore,
  type Ticket, type InsertTicket,
  type Kit, type InsertKit,
  type Admin, type InsertAdmin,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Suppliers
  getSupplier(id: string): Promise<Supplier | undefined>;
  getSupplierByCnpj(cnpj: string): Promise<Supplier | undefined>;
  getAllSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
  
  // Stores
  getStore(id: string): Promise<Store | undefined>;
  getStoreByCode(code: string): Promise<Store | undefined>;
  getAllStores(): Promise<Store[]>;
  searchStores(filters: {
    cep?: string;
    address?: string;
    state?: string;
    city?: string;
    code?: string;
  }): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: string, store: Partial<InsertStore>): Promise<Store | undefined>;
  deleteStore(id: string): Promise<boolean>;
  
  // Tickets
  getTicket(id: string): Promise<Ticket | undefined>;
  getAllTickets(): Promise<Ticket[]>;
  getTicketsByType(type: string): Promise<Ticket[]>;
  getTicketsByStatus(status: string): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, ticket: Partial<Ticket>): Promise<Ticket | undefined>;
  resolveTicket(id: string, resolvedBy: string): Promise<Ticket | undefined>;
  
  // Kits
  getKit(id: string): Promise<Kit | undefined>;
  getAllKits(): Promise<Kit[]>;
  getKitsByStore(storeId: string): Promise<Kit[]>;
  createKit(kit: InsertKit): Promise<Kit>;
  updateKit(id: string, kit: Partial<InsertKit>): Promise<Kit | undefined>;
  
  // Admins
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  getAllAdmins(): Promise<Admin[]>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: string, admin: Partial<InsertAdmin>): Promise<Admin | undefined>;
  approveAdmin(id: string): Promise<Admin | undefined>;
  
  // Analytics
  getDashboardMetrics(): Promise<{
    completedInstallations: number;
    pendingInstallations: number;
    openTickets: number;
    totalBudget: number;
    monthlyInstallations: number[];
    ticketsByStatus: { open: number; resolved: number };
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private suppliers: Map<string, Supplier>;
  private stores: Map<string, Store>;
  private tickets: Map<string, Ticket>;
  private kits: Map<string, Kit>;
  private admins: Map<string, Admin>;

  constructor() {
    this.users = new Map();
    this.suppliers = new Map();
    this.stores = new Map();
    this.tickets = new Map();
    this.kits = new Map();
    this.admins = new Map();
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample admin
    const adminId = randomUUID();
    const admin: Admin = {
      id: adminId,
      name: "Admin Principal",
      email: "admin@franquias.com",
      password: "admin123", // In production, this should be hashed
      approved: true,
      createdAt: new Date(),
    };
    this.admins.set(adminId, admin);

    // Create admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      password: "admin123",
      role: "admin",
      entityId: adminId,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample supplier
    const supplierId = randomUUID();
    const supplier: Supplier = {
      id: supplierId,
      name: "Tech Solutions LTDA",
      cnpj: "12.345.678/0001-90",
      responsible: "Carlos Mendes",
      phone: "(11) 99999-9999",
      address: "Rua das Tecnologias, 100",
      approvedBudget: "250000.00",
      createdAt: new Date(),
    };
    this.suppliers.set(supplierId, supplier);

    // Create supplier user
    const supplierUser: User = {
      id: randomUUID(),
      username: "supplier",
      password: "supplier123",
      role: "supplier",
      entityId: supplierId,
      createdAt: new Date(),
    };
    this.users.set(supplierUser.id, supplierUser);

    // Create sample stores
    const stores = [
      {
        name: "Loja Centro - SP001",
        code: "SP001",
        cnpj: "98.765.432/0001-10",
        address: "Rua das Flores, 123 - Centro",
        cep: "01234-567",
        city: "São Paulo",
        state: "SP",
        responsible: "Maria Silva",
      },
      {
        name: "Loja Shopping - RJ002",
        code: "RJ002",
        cnpj: "11.222.333/0001-44",
        address: "Av. Principal, 456 - Copacabana",
        cep: "22000-000",
        city: "Rio de Janeiro",
        state: "RJ",
        responsible: "João Santos",
      },
    ];

    stores.forEach((storeData, index) => {
      const storeId = randomUUID();
      const store: Store = {
        id: storeId,
        ...storeData,
        photos: [],
        installationCompleted: index === 0,
        installationDate: index === 0 ? new Date() : null,
        installerName: index === 0 ? "José Instalador" : null,
        createdAt: new Date(),
      };
      this.stores.set(storeId, store);

      // Create store user
      const storeUser: User = {
        id: randomUUID(),
        username: `store${index + 1}`,
        password: "store123",
        role: "store",
        entityId: storeId,
        createdAt: new Date(),
      };
      this.users.set(storeUser.id, storeUser);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Suppliers
  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async getSupplierByCnpj(cnpj: string): Promise<Supplier | undefined> {
    return Array.from(this.suppliers.values()).find(supplier => supplier.cnpj === cnpj);
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = randomUUID();
    const supplier: Supplier = { ...insertSupplier, id, createdAt: new Date() };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async updateSupplier(id: string, supplierData: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (!supplier) return undefined;

    const updated = { ...supplier, ...supplierData };
    this.suppliers.set(id, updated);
    return updated;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return this.suppliers.delete(id);
  }

  // Stores
  async getStore(id: string): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async getStoreByCode(code: string): Promise<Store | undefined> {
    return Array.from(this.stores.values()).find(store => store.code === code);
  }

  async getAllStores(): Promise<Store[]> {
    return Array.from(this.stores.values());
  }

  async searchStores(filters: {
    cep?: string;
    address?: string;
    state?: string;
    city?: string;
    code?: string;
  }): Promise<Store[]> {
    return Array.from(this.stores.values()).filter(store => {
      if (filters.cep && !store.cep.includes(filters.cep)) return false;
      if (filters.address && !store.address.toLowerCase().includes(filters.address.toLowerCase())) return false;
      if (filters.state && store.state !== filters.state) return false;
      if (filters.city && !store.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.code && !store.code.includes(filters.code)) return false;
      return true;
    });
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const id = randomUUID();
    const store: Store = { ...insertStore, id, createdAt: new Date() };
    this.stores.set(id, store);
    return store;
  }

  async updateStore(id: string, storeData: Partial<InsertStore>): Promise<Store | undefined> {
    const store = this.stores.get(id);
    if (!store) return undefined;

    const updated = { ...store, ...storeData };
    this.stores.set(id, updated);
    return updated;
  }

  async deleteStore(id: string): Promise<boolean> {
    return this.stores.delete(id);
  }

  // Tickets
  async getTicket(id: string): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getAllTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }

  async getTicketsByType(type: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(ticket => ticket.type === type);
  }

  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(ticket => ticket.status === status);
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = randomUUID();
    const ticket: Ticket = { ...insertTicket, id, createdAt: new Date() };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async updateTicket(id: string, ticketData: Partial<Ticket>): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;

    const updated = { ...ticket, ...ticketData };
    this.tickets.set(id, updated);
    return updated;
  }

  async resolveTicket(id: string, resolvedBy: string): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;

    const updated = {
      ...ticket,
      status: "resolved" as const,
      resolvedBy,
      resolvedAt: new Date(),
    };
    this.tickets.set(id, updated);
    return updated;
  }

  // Kits
  async getKit(id: string): Promise<Kit | undefined> {
    return this.kits.get(id);
  }

  async getAllKits(): Promise<Kit[]> {
    return Array.from(this.kits.values());
  }

  async getKitsByStore(storeId: string): Promise<Kit[]> {
    return Array.from(this.kits.values()).filter(kit => kit.storeId === storeId);
  }

  async createKit(insertKit: InsertKit): Promise<Kit> {
    const id = randomUUID();
    const kit: Kit = { ...insertKit, id, createdAt: new Date() };
    this.kits.set(id, kit);
    return kit;
  }

  async updateKit(id: string, kitData: Partial<InsertKit>): Promise<Kit | undefined> {
    const kit = this.kits.get(id);
    if (!kit) return undefined;

    const updated = { ...kit, ...kitData };
    this.kits.set(id, updated);
    return updated;
  }

  // Admins
  async getAdmin(id: string): Promise<Admin | undefined> {
    return this.admins.get(id);
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(admin => admin.email === email);
  }

  async getAllAdmins(): Promise<Admin[]> {
    return Array.from(this.admins.values());
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const id = randomUUID();
    const admin: Admin = { ...insertAdmin, id, approved: false, createdAt: new Date() };
    this.admins.set(id, admin);
    return admin;
  }

  async updateAdmin(id: string, adminData: Partial<InsertAdmin>): Promise<Admin | undefined> {
    const admin = this.admins.get(id);
    if (!admin) return undefined;

    const updated = { ...admin, ...adminData };
    this.admins.set(id, updated);
    return updated;
  }

  async approveAdmin(id: string): Promise<Admin | undefined> {
    const admin = this.admins.get(id);
    if (!admin) return undefined;

    const updated = { ...admin, approved: true };
    this.admins.set(id, updated);
    return updated;
  }

  // Analytics
  async getDashboardMetrics(): Promise<{
    completedInstallations: number;
    pendingInstallations: number;
    openTickets: number;
    totalBudget: number;
    monthlyInstallations: number[];
    ticketsByStatus: { open: number; resolved: number };
  }> {
    const stores = Array.from(this.stores.values());
    const tickets = Array.from(this.tickets.values());
    const suppliers = Array.from(this.suppliers.values());

    const completedInstallations = stores.filter(store => store.installationCompleted).length;
    const pendingInstallations = stores.filter(store => !store.installationCompleted).length;
    const openTickets = tickets.filter(ticket => ticket.status === "open").length;
    const totalBudget = suppliers.reduce((sum, supplier) => 
      sum + parseFloat(supplier.approvedBudget || "0"), 0
    );

    // Generate sample monthly data (in production, this would come from real data)
    const monthlyInstallations = [65, 75, 80, 85, 90, 95];
    
    const ticketsByStatus = {
      open: tickets.filter(ticket => ticket.status === "open").length,
      resolved: tickets.filter(ticket => ticket.status === "resolved").length,
    };

    return {
      completedInstallations,
      pendingInstallations,
      openTickets,
      totalBudget,
      monthlyInstallations,
      ticketsByStatus,
    };
  }
}

export const storage = new MemStorage();
