import { pool, testConnection } from './mysql-db';
import { 
  Supplier, 
  InsertSupplier, 
  Store, 
  InsertStore, 
  Kit, 
  InsertKit, 
  Ticket, 
  InsertTicket, 
  Admin, 
  InsertAdmin, 
  Photo, 
  InsertPhoto, 
  Installation, 
  InsertInstallation 
} from '../shared/mysql-schema';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface IStorage {
  // Suppliers
  getSupplierByCnpj(cnpj: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  getAllSuppliers(): Promise<Supplier[]>;
  
  // Stores
  getStoreByCode(codigo_loja: string): Promise<Store | undefined>;
  getStoresByFilters(filters: Partial<Store>): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  getAllStores(): Promise<Store[]>;
  
  // Kits
  getAllKits(): Promise<Kit[]>;
  createKit(kit: InsertKit): Promise<Kit>;
  
  // Tickets
  getAllTickets(): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  
  // Admins
  getAllAdmins(): Promise<Admin[]>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  
  // Photos
  getPhotosByStoreId(loja_id: string): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  
  // Installations
  getAllInstallations(): Promise<Installation[]>;
  createInstallation(installation: InsertInstallation): Promise<Installation>;
  
  // Analytics
  getDashboardMetrics(): Promise<{
    totalSuppliers: number;
    totalStores: number;
    totalTickets: number;
    pendingInstallations: number;
  }>;
}

export class MySQLStorage implements IStorage {
  constructor() {
    // Inicializar tabelas de forma assíncrona para não bloquear o startup
    this.initializeTables().catch(error => {
      console.log('⚠️ Executando em modo fallback (sem conexão MySQL real)');
      console.log('🔧 Para conectar ao MySQL da Hostinger, verifique:');
      console.log('1. Se o host está correto no painel da Hostinger');
      console.log('2. Se conexões remotas estão habilitadas');
      console.log('3. Se não há firewall bloqueando a porta 3306');
    });
  }

  private async initializeTables() {
    try {
      await testConnection();
      
      // Criar tabelas se não existirem
      const tables = [
        `CREATE TABLE IF NOT EXISTS fornecedores (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome_fornecedor VARCHAR(255) NOT NULL,
          cnpj VARCHAR(18) UNIQUE NOT NULL,
          nome_responsavel VARCHAR(255) NOT NULL,
          telefone VARCHAR(20) NOT NULL,
          endereco TEXT NOT NULL,
          valor_orcamento DECIMAL(10,2) NOT NULL
        )`,
        
        `CREATE TABLE IF NOT EXISTS lojas (
          codigo_loja VARCHAR(20) PRIMARY KEY,
          nome_loja VARCHAR(255) NOT NULL,
          nome_operador VARCHAR(255) NOT NULL,
          logradouro VARCHAR(255) NOT NULL,
          numero VARCHAR(10) NOT NULL,
          complemento VARCHAR(100),
          bairro VARCHAR(100) NOT NULL,
          cidade VARCHAR(100) NOT NULL,
          uf CHAR(2) NOT NULL,
          cep VARCHAR(10) NOT NULL,
          regiao VARCHAR(50) NOT NULL,
          telefone_loja VARCHAR(20) NOT NULL
        )`,
        
        `CREATE TABLE IF NOT EXISTS kits (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome_peca VARCHAR(255) NOT NULL,
          descricao TEXT NOT NULL,
          image VARCHAR(500)
        )`,
        
        `CREATE TABLE IF NOT EXISTS chamados (
          id INT AUTO_INCREMENT PRIMARY KEY,
          descricao TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'aberto',
          loja_id VARCHAR(20) NOT NULL,
          fornecedor_id INT NOT NULL,
          data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (loja_id) REFERENCES lojas(codigo_loja),
          FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS admins (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          senha VARCHAR(255) NOT NULL
        )`,
        
        `CREATE TABLE IF NOT EXISTS fotos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          loja_id VARCHAR(20) NOT NULL,
          foto_url VARCHAR(500) NOT NULL,
          FOREIGN KEY (loja_id) REFERENCES lojas(codigo_loja)
        )`,
        
        `CREATE TABLE IF NOT EXISTS instalacoes (
          id VARCHAR(36) PRIMARY KEY,
          loja_id VARCHAR(20) NOT NULL,
          fornecedor_id INT NOT NULL,
          responsible VARCHAR(255) NOT NULL,
          installationDate VARCHAR(20) NOT NULL,
          photos JSON,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (loja_id) REFERENCES lojas(codigo_loja),
          FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
        )`
      ];

      for (const table of tables) {
        await pool.execute(table);
      }
      
      console.log('✅ Tabelas do MySQL criadas/verificadas com sucesso!');
      await this.insertSampleData();
    } catch (error) {
      console.error('❌ Erro ao inicializar tabelas MySQL:', error);
    }
  }

  private async insertSampleData() {
    try {
      // Inserir fornecedor de exemplo
      const [supplierRows] = await pool.execute(
        'SELECT COUNT(*) as count FROM fornecedores'
      ) as [RowDataPacket[], any];
      
      if (supplierRows[0].count === 0) {
        await pool.execute(
          `INSERT INTO fornecedores (nome_fornecedor, cnpj, nome_responsavel, telefone, endereco, valor_orcamento) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['TechSolutions Ltda', '12.345.678/0001-90', 'João Silva', '(11) 99999-9999', 'Rua das Flores, 123', 15000.00]
        );
      }

      // Inserir lojas de exemplo
      const [storeRows] = await pool.execute(
        'SELECT COUNT(*) as count FROM lojas'
      ) as [RowDataPacket[], any];
      
      if (storeRows[0].count === 0) {
        const stores = [
          ['L001', 'Loja Centro', 'Maria Santos', 'Rua Principal', '100', '', 'Centro', 'São Paulo', 'SP', '01010-000', 'Sudeste', '(11) 1111-1111'],
          ['L002', 'Loja Norte', 'Pedro Costa', 'Av. Norte', '200', 'Sala 2', 'Vila Norte', 'São Paulo', 'SP', '02020-000', 'Sudeste', '(11) 2222-2222'],
          ['L003', 'Loja Sul', 'Ana Oliveira', 'Rua Sul', '300', '', 'Jardim Sul', 'São Paulo', 'SP', '03030-000', 'Sudeste', '(11) 3333-3333']
        ];

        for (const store of stores) {
          await pool.execute(
            `INSERT INTO lojas (codigo_loja, nome_loja, nome_operador, logradouro, numero, complemento, bairro, cidade, uf, cep, regiao, telefone_loja)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            store
          );
        }
      }
      
      console.log('✅ Dados de exemplo inseridos com sucesso!');
    } catch (error) {
      console.log('ℹ️ Dados de exemplo já existem ou erro na inserção:', error);
    }
  }

  // Implementação dos métodos da interface

  async getSupplierByCnpj(cnpj: string): Promise<Supplier | undefined> {
    const [rows] = await pool.execute(
      'SELECT * FROM fornecedores WHERE cnpj = ?',
      [cnpj]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Supplier | undefined;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [result] = await pool.execute(
      `INSERT INTO fornecedores (nome_fornecedor, cnpj, nome_responsavel, telefone, endereco, valor_orcamento)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [supplier.nome_fornecedor, supplier.cnpj, supplier.nome_responsavel, supplier.telefone, supplier.endereco, supplier.valor_orcamento]
    ) as [ResultSetHeader, any];

    const [rows] = await pool.execute(
      'SELECT * FROM fornecedores WHERE id = ?',
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Supplier;
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    const [rows] = await pool.execute('SELECT * FROM fornecedores') as [RowDataPacket[], any];
    return rows as Supplier[];
  }

  async getStoreByCode(codigo_loja: string): Promise<Store | undefined> {
    const [rows] = await pool.execute(
      'SELECT * FROM lojas WHERE codigo_loja = ?',
      [codigo_loja]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Store | undefined;
  }

  async getStoresByFilters(filters: Partial<Store>): Promise<Store[]> {
    let query = 'SELECT * FROM lojas WHERE 1=1';
    const params: any[] = [];

    if (filters.codigo_loja) {
      query += ' AND codigo_loja LIKE ?';
      params.push(`%${filters.codigo_loja}%`);
    }
    if (filters.cep) {
      query += ' AND cep LIKE ?';
      params.push(`%${filters.cep}%`);
    }
    if (filters.cidade) {
      query += ' AND cidade LIKE ?';
      params.push(`%${filters.cidade}%`);
    }
    if (filters.uf) {
      query += ' AND uf = ?';
      params.push(filters.uf);
    }
    if (filters.regiao) {
      query += ' AND regiao LIKE ?';
      params.push(`%${filters.regiao}%`);
    }

    const [rows] = await pool.execute(query, params) as [RowDataPacket[], any];
    return rows as Store[];
  }

  async createStore(store: InsertStore): Promise<Store> {
    await pool.execute(
      `INSERT INTO lojas (codigo_loja, nome_loja, nome_operador, logradouro, numero, complemento, bairro, cidade, uf, cep, regiao, telefone_loja)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [store.codigo_loja, store.nome_loja, store.nome_operador, store.logradouro, store.numero, store.complemento, store.bairro, store.cidade, store.uf, store.cep, store.regiao, store.telefone_loja]
    );
    
    return store as Store;
  }

  async getAllStores(): Promise<Store[]> {
    const [rows] = await pool.execute('SELECT * FROM lojas') as [RowDataPacket[], any];
    return rows as Store[];
  }

  async getAllKits(): Promise<Kit[]> {
    const [rows] = await pool.execute('SELECT * FROM kits') as [RowDataPacket[], any];
    return rows as Kit[];
  }

  async createKit(kit: InsertKit): Promise<Kit> {
    const [result] = await pool.execute(
      'INSERT INTO kits (nome_peca, descricao, image) VALUES (?, ?, ?)',
      [kit.nome_peca, kit.descricao, kit.image]
    ) as [ResultSetHeader, any];

    const [rows] = await pool.execute(
      'SELECT * FROM kits WHERE id = ?',
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Kit;
  }

  async getAllTickets(): Promise<Ticket[]> {
    const [rows] = await pool.execute('SELECT * FROM chamados') as [RowDataPacket[], any];
    return rows as Ticket[];
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [result] = await pool.execute(
      'INSERT INTO chamados (descricao, status, loja_id, fornecedor_id, data_abertura) VALUES (?, ?, ?, ?, ?)',
      [ticket.descricao, ticket.status, ticket.loja_id, ticket.fornecedor_id, ticket.data_abertura || new Date()]
    ) as [ResultSetHeader, any];

    const [rows] = await pool.execute(
      'SELECT * FROM chamados WHERE id = ?',
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Ticket;
  }

  async getAllAdmins(): Promise<Admin[]> {
    const [rows] = await pool.execute('SELECT * FROM admins') as [RowDataPacket[], any];
    return rows as Admin[];
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [result] = await pool.execute(
      'INSERT INTO admins (nome, email, senha) VALUES (?, ?, ?)',
      [admin.nome, admin.email, admin.senha]
    ) as [ResultSetHeader, any];

    const [rows] = await pool.execute(
      'SELECT * FROM admins WHERE id = ?',
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Admin;
  }

  async getPhotosByStoreId(loja_id: string): Promise<Photo[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM fotos WHERE loja_id = ?',
      [loja_id]
    ) as [RowDataPacket[], any];
    
    return rows as Photo[];
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [result] = await pool.execute(
      'INSERT INTO fotos (loja_id, foto_url) VALUES (?, ?)',
      [photo.loja_id, photo.foto_url]
    ) as [ResultSetHeader, any];

    const [rows] = await pool.execute(
      'SELECT * FROM fotos WHERE id = ?',
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Photo;
  }

  async getAllInstallations(): Promise<Installation[]> {
    const [rows] = await pool.execute('SELECT * FROM instalacoes') as [RowDataPacket[], any];
    return rows.map(row => ({
      ...row,
      photos: JSON.parse(row.photos || '[]')
    })) as Installation[];
  }

  async createInstallation(installation: InsertInstallation): Promise<Installation> {
    const id = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const photosJson = JSON.stringify(installation.photos || []);
    
    await pool.execute(
      'INSERT INTO instalacoes (id, loja_id, fornecedor_id, responsible, installationDate, photos) VALUES (?, ?, ?, ?, ?, ?)',
      [id, installation.loja_id, installation.fornecedor_id, installation.responsible, installation.installationDate, photosJson]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM instalacoes WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];
    
    const result = rows[0];
    return {
      ...result,
      photos: JSON.parse(result.photos || '[]')
    } as Installation;
  }

  async getDashboardMetrics(): Promise<{
    totalSuppliers: number;
    totalStores: number;
    totalTickets: number;
    pendingInstallations: number;
  }> {
    const [supplierRows] = await pool.execute('SELECT COUNT(*) as count FROM fornecedores') as [RowDataPacket[], any];
    const [storeRows] = await pool.execute('SELECT COUNT(*) as count FROM lojas') as [RowDataPacket[], any];
    const [ticketRows] = await pool.execute('SELECT COUNT(*) as count FROM chamados') as [RowDataPacket[], any];
    const [installationRows] = await pool.execute('SELECT COUNT(*) as count FROM instalacoes') as [RowDataPacket[], any];

    return {
      totalSuppliers: supplierRows[0].count,
      totalStores: storeRows[0].count,
      totalTickets: ticketRows[0].count,
      pendingInstallations: installationRows[0].count,
    };
  }
}

export const storage = new MySQLStorage();