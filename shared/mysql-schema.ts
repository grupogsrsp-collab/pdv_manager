import { z } from "zod";

// Interfaces baseadas nos campos do MySQL que você especificou

// Fornecedores
export interface Supplier {
  id: number;
  nome_fornecedor: string;
  cnpj: string;
  nome_responsavel: string;
  telefone: string;
  endereco: string;
  valor_orcamento: number;
}

export interface InsertSupplier {
  nome_fornecedor: string;
  cnpj: string;
  nome_responsavel: string;
  telefone: string;
  endereco: string;
  valor_orcamento: number;
}

// Lojas
export interface Store {
  id: number;
  codigo_loja: string;
  nome_loja: string;
  nome_operador: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  regiao: string;
  telefone_loja: string;
}

export interface InsertStore {
  codigo_loja: string;
  nome_loja: string;
  nome_operador: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  regiao: string;
  telefone_loja: string;
}

// Kits
export interface Kit {
  id: number;
  nome_peca: string;
  descricao: string;
  image?: string;
}

export interface InsertKit {
  nome_peca: string;
  descricao: string;
  image?: string;
}

// Chamados/Tickets
export interface Ticket {
  id: number;
  descricao: string;
  status: string;
  loja_id: number;
  fornecedor_id: number;
  data_abertura: Date;
}

export interface InsertTicket {
  descricao: string;
  status: string;
  loja_id: number;
  fornecedor_id: number;
  data_abertura?: Date;
}

// Admins
export interface Admin {
  id: number;
  nome: string;
  email: string;
  senha: string;
}

export interface InsertAdmin {
  nome: string;
  email: string;
  senha: string;
}

// Fotos
export interface Photo {
  id: number;
  loja_id: string;
  foto_url: string;
}

export interface InsertPhoto {
  loja_id: string;
  foto_url: string;
}

// Instalações (não estava nos campos originais, mas mantendo para compatibilidade)
export interface Installation {
  id: string;
  loja_id: string;
  fornecedor_id: number;
  responsible: string;
  installationDate: string;
  photos: string[];
  createdAt: Date;
}

export interface InsertInstallation {
  loja_id: string;
  fornecedor_id: number;
  responsible: string;
  installationDate: string;
  photos?: string[];
}

// Schemas de validação usando Zod
export const insertSupplierSchema = z.object({
  nome_fornecedor: z.string().min(1, "Nome do fornecedor é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  nome_responsavel: z.string().min(1, "Nome do responsável é obrigatório"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  valor_orcamento: z.number().positive("Valor do orçamento deve ser positivo"),
});

export const insertStoreSchema = z.object({
  codigo_loja: z.string().min(1, "Código da loja é obrigatório"),
  nome_loja: z.string().min(1, "Nome da loja é obrigatório"),
  nome_operador: z.string().min(1, "Nome do operador é obrigatório"),
  logradouro: z.string().min(1, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  uf: z.string().length(2, "UF deve ter 2 caracteres"),
  cep: z.string().min(8, "CEP deve ter 8 dígitos"),
  regiao: z.string().min(1, "Região é obrigatória"),
  telefone_loja: z.string().min(1, "Telefone da loja é obrigatório"),
});

export const insertKitSchema = z.object({
  nome_peca: z.string().min(1, "Nome da peça é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  image: z.string().optional(),
});

export const insertTicketSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  status: z.string().default("aberto"),
  loja_id: z.number().positive("ID da loja é obrigatório"),
  fornecedor_id: z.number().positive("ID do fornecedor deve ser positivo"),
  data_abertura: z.date().optional(),
});

export const insertAdminSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email deve ser válido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const insertPhotoSchema = z.object({
  loja_id: z.string().min(1, "ID da loja é obrigatório"),
  foto_url: z.string().url("URL da foto deve ser válida"),
});

export const insertInstallationSchema = z.object({
  loja_id: z.string().min(1, "Código da loja é obrigatório"),
  fornecedor_id: z.number().positive("ID do fornecedor deve ser positivo"),
  responsible: z.string().min(1, "Responsável é obrigatório"),
  installationDate: z.string().min(1, "Data de instalação é obrigatória"),
  photos: z.array(z.string()).optional(),
});

// Schema para busca de CNPJ
export const cnpjSearchSchema = z.object({
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres"),
});

// Schema para filtros de loja
export const storeFilterSchema = z.object({
  codigo_loja: z.string().optional(),
  cep: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  regiao: z.string().optional(),
});