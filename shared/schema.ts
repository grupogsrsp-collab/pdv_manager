import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cnpj: varchar("cnpj", { length: 18 }).notNull().unique(),
  responsible: text("responsible").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address").notNull(),
  approvedBudget: decimal("approved_budget", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  cnpj: varchar("cnpj", { length: 18 }),
  address: text("address").notNull(),
  cep: varchar("cep", { length: 10 }).notNull(),
  city: text("city").notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  responsible: text("responsible"),
  photos: json("photos").$type<string[]>().default([]),
  installationCompleted: boolean("installation_completed").default(false),
  installationDate: timestamp("installation_date"),
  installerName: text("installer_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 20 }).notNull(), // 'supplier' or 'store'
  entityId: varchar("entity_id").notNull(),
  entityName: text("entity_name").notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).default("open"), // 'open' or 'resolved'
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const kits = pgTable("kits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  used: boolean("used").default(false),
  storeId: varchar("store_id").references(() => stores.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  approved: boolean("approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'supplier', 'store', 'admin'
  entityId: varchar("entity_id"), // links to supplier, store, or admin id
  createdAt: timestamp("created_at").defaultNow(),
});

export const installations = pgTable("installations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  responsibleName: text("responsible_name").notNull(),
  installationDate: timestamp("installation_date").notNull(),
  photos: json("photos").$type<string[]>().default([]),
  status: varchar("status", { length: 20 }).default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  resolvedBy: true,
  resolvedAt: true,
});

export const insertKitSchema = createInsertSchema(kits).omit({
  id: true,
  createdAt: true,
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
  approved: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertInstallationSchema = createInsertSchema(installations).omit({
  id: true,
  createdAt: true,
});

// Types
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type Kit = typeof kits.$inferSelect;
export type InsertKit = z.infer<typeof insertKitSchema>;

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Installation = typeof installations.$inferSelect;
export type InsertInstallation = z.infer<typeof insertInstallationSchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["supplier", "store", "admin"]),
});

export type LoginRequest = z.infer<typeof loginSchema>;
