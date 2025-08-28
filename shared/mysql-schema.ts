import { z } from "zod";

// Interfaces baseadas nos campos do MySQL que você especificou

// Fornecedores
export interface Supplier {
  id: number;
  nome_fornecedor: string;
  cnpj: string;
  cpf: string;
  nome_responsavel: string;
  telefone: string;
  endereco: string;
  estado: string;
  valor_orcamento: number;
  email: string;
}

export interface InsertSupplier {
  nome_fornecedor?: string;
  cnpj?: string;
  cpf?: string;
  nome_responsavel?: string;
  telefone?: string;
  endereco?: string;
  estado?: string;
  valor_orcamento?: number;
  email?: string;
}

// Funcionários dos Fornecedores
export interface SupplierEmployee {
  id: number;
  fornecedor_id: number;
  nome_funcionario: string;
  cpf: string;
  telefone: string;
}

export interface InsertSupplierEmployee {
  fornecedor_id?: number;
  nome_funcionario: string;
  cpf?: string;
  telefone?: string;
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
  image_url: string | null;
  sim: number;
  nao: number;
}

export interface InsertKit {
  nome_peca: string;
  descricao: string;
  image_url?: string;
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

// Fotos Finais (depois da instalação)
export interface FotoFinal {
  id: number;
  loja_id: string;
  foto_url: string;
  kit_id?: number;
}

export interface InsertFotoFinal {
  loja_id: string;
  foto_url: string;
  kit_id?: number;
}

// Fotos Originais da Loja (antes da instalação)
export interface FotoOriginalLoja {
  id: number;
  loja_id: string;
  foto_url: string;
  kit_id: number;
}

export interface InsertFotoOriginalLoja {
  loja_id: string;
  foto_url: string;
  kit_id: number;
}

// Instalações (não estava nos campos originais, mas mantendo para compatibilidade)
export interface Installation {
  id: string;
  loja_id: string;
  fornecedor_id: number;
  responsible: string;
  installationDate: string;
  fotosOriginais: string[];
  fotosFinais: string[];
  justificativaFotos?: string;
  createdAt: Date;
  // Campos de geolocalização
  latitude?: number;
  longitude?: number;
  endereco_geolocalizacao?: string;
  mapa_screenshot_url?: string;
  geolocalizacao_timestamp?: Date;
}

export interface InsertInstallation {
  loja_id: string;
  fornecedor_id: number;
  responsible: string;
  installationDate: string;
  fotosOriginais?: string[];
  fotosFinais?: string[];
  justificativaFotos?: string;
  // Campos de geolocalização
  latitude?: number;
  longitude?: number;
  endereco_geolocalizacao?: string;
  mapa_screenshot_url?: string;
  geolocalizacao_timestamp?: Date;
}

// Schemas de validação usando Zod
export const insertSupplierSchema = z.object({
  nome_fornecedor: z.string().optional(),
  cnpj: z.string().optional(),
  cpf: z.string().optional(),
  nome_responsavel: z.string().optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  estado: z.string().optional(),
  valor_orcamento: z.number().optional(),
});

export const insertSupplierEmployeeSchema = z.object({
  fornecedor_id: z.number().optional(),
  nome_funcionario: z.string().min(1, "Nome do funcionário é obrigatório"),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
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
  image_url: z.string().url("URL da imagem inválida").optional(),
});

export const insertTicketSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  status: z.string().default("aberto"),
  loja_id: z.number().positive("ID da loja é obrigatório"),
  fornecedor_id: z.number().positive().optional(), // Tornando opcional para chamados de lojas
  data_abertura: z.date().optional(),
});

export const insertAdminSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email deve ser válido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const insertFotoFinalSchema = z.object({
  loja_id: z.string().min(1, "ID da loja é obrigatório"),
  foto_url: z.string().url("URL da foto deve ser válida"),
  kit_id: z.number().optional(),
});

export const insertFotoOriginalLojaSchema = z.object({
  loja_id: z.string().min(1, "ID da loja é obrigatório"),
  foto_url: z.string().url("URL da foto deve ser válida"),
  kit_id: z.number().positive("ID do kit é obrigatório"),
});

export const insertInstallationSchema = z.object({
  loja_id: z.string().min(1, "Código da loja é obrigatório"),
  fornecedor_id: z.number().positive("ID do fornecedor deve ser positivo"),
  responsible: z.string().min(1, "Responsável é obrigatório"),
  installationDate: z.string().min(1, "Data de instalação é obrigatória"),
  fotosOriginais: z.array(z.string()).optional(),
  fotosFinais: z.array(z.string()).optional(),
  justificativaFotos: z.string().optional(),
  // Campos de geolocalização
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  endereco_geolocalizacao: z.string().optional(),
  mapa_screenshot_url: z.string().optional(),
  geolocalizacao_timestamp: z.date().optional(),
});

// Schema para busca de CNPJ
export const cnpjSearchSchema = z.object({
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres"),
});

// Schema para busca de CPF
export const cpfSearchSchema = z.object({
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 caracteres"),
});

// Schema para filtros de loja
export const storeFilterSchema = z.object({
  codigo_loja: z.string().optional(),
  cep: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  regiao: z.string().optional(),
});