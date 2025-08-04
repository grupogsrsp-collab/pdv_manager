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
  getSupplierById(id: number): Promise<Supplier>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;
  getAllSuppliers(): Promise<Supplier[]>;
  
  // Stores
  getStoreByCode(codigo_loja: string): Promise<Store | undefined>;
  getStoreById(codigo_loja: string): Promise<Store>;
  getStoresByFilters(filters: Partial<Store>): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(codigo_loja: string, store: Partial<InsertStore>): Promise<Store>;
  deleteStore(codigo_loja: string): Promise<void>;
  getAllStores(): Promise<Store[]>;
  
  // Kits
  getAllKits(): Promise<Kit[]>;
  createKit(kit: InsertKit): Promise<Kit>;
  
  // Tickets
  getAllTickets(): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  resolveTicket(id: number): Promise<void>;
  
  // Admins
  getAllAdmins(): Promise<Admin[]>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: number, admin: Partial<InsertAdmin>): Promise<Admin>;
  deleteAdmin(id: number): Promise<void>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  
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
    openTickets: number;
    resolvedTickets: number;
    completedInstallations: number;
    unusedKits: number;
    monthlyInstallations: number[];
    ticketsByStatus: { open: number; resolved: number };
    unusedKitsList: any[];
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
          id INT AUTO_INCREMENT PRIMARY KEY,
          codigo_loja VARCHAR(20) UNIQUE NOT NULL,
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
          loja_id INT NOT NULL,
          fornecedor_id INT NOT NULL,
          data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (loja_id) REFERENCES lojas(id),
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
          loja_id INT NOT NULL,
          foto_url VARCHAR(500) NOT NULL,
          FOREIGN KEY (loja_id) REFERENCES lojas(id)
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
        const suppliers = [
          ['SuperTech Supplies', '12345678000190', 'João Silva', '(11) 99999-9999', 'Rua das Flores, 123', 15000.00],
          ['ABC Ferramentas', '98765432000110', 'Maria Costa', '(11) 88888-8888', 'Av. Industrial, 456', 25000.00]
        ];
        
        for (const supplier of suppliers) {
          await pool.execute(
            `INSERT INTO fornecedores (nome_fornecedor, cnpj, nome_responsavel, telefone, endereco, valor_orcamento) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            supplier
          );
        }
      }

      // Inserir lojas de exemplo
      const [storeRows] = await pool.execute(
        'SELECT COUNT(*) as count FROM lojas'
      ) as [RowDataPacket[], any];
      
      if (storeRows[0].count === 0) {
        const stores = [
          ['51974', 'HELP INFORMATICA', 'Maria Santos', 'Rua Principal', '100', '', 'Centro', 'São Paulo', 'SP', '01010-000', 'Sudeste', '(11) 1111-1111'],
          ['51975', 'Loja Norte', 'Pedro Costa', 'Av. Norte', '200', 'Sala 2', 'Vila Norte', 'São Paulo', 'SP', '02020-000', 'Sudeste', '(11) 2222-2222'],
          ['51976', 'Loja Sul', 'Ana Oliveira', 'Rua Sul', '300', '', 'Jardim Sul', 'São Paulo', 'SP', '03030-000', 'Sudeste', '(11) 3333-3333']
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
    // Limpar CNPJ removendo pontos, barras e hífens para busca flexível
    const cleanCnpj = cnpj.replace(/[.\-\/\s]/g, '');
    
    console.log('Buscando fornecedor com CNPJ:', cnpj, 'CNPJ limpo:', cleanCnpj);
    
    // Primeira tentativa: busca exata com CNPJ limpo
    let [rows] = await pool.execute(
      'SELECT * FROM fornecedores WHERE REPLACE(REPLACE(REPLACE(cnpj, ".", ""), "/", ""), "-", "") = ?',
      [cleanCnpj]
    ) as [RowDataPacket[], any];
    
    console.log('Primeira busca - Resultados encontrados:', rows.length);
    
    // Se não encontrou, busca usando LIKE para encontrar CNPJs similares
    if (rows.length === 0) {
      console.log('Tentando busca com LIKE...');
      [rows] = await pool.execute(
        'SELECT * FROM fornecedores WHERE REPLACE(REPLACE(REPLACE(cnpj, ".", ""), "/", ""), "-", "") LIKE ?',
        [`%${cleanCnpj}%`]
      ) as [RowDataPacket[], any];
      
      console.log('Segunda busca (LIKE) - Resultados encontrados:', rows.length);
    }
    
    // Se ainda não encontrou, lista todos os CNPJs para debug
    if (rows.length === 0) {
      console.log('Nenhum fornecedor encontrado. Listando todos os CNPJs na base:');
      const [allRows] = await pool.execute(
        'SELECT id, nome_fornecedor, cnpj FROM fornecedores'
      ) as [RowDataPacket[], any];
      
      allRows.forEach((row: any) => {
        const dbCleanCnpj = row.cnpj.replace(/[.\-\/\s]/g, '');
        console.log(`ID: ${row.id}, Nome: ${row.nome_fornecedor}, CNPJ: ${row.cnpj}, CNPJ limpo: ${dbCleanCnpj}`);
      });
    }
    
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

  async getSupplierById(id: number): Promise<Supplier> {
    const [rows] = await pool.execute(
      'SELECT * FROM fornecedores WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Supplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const fields = [];
    const values = [];
    
    if (supplier.nome_fornecedor) {
      fields.push('nome_fornecedor = ?');
      values.push(supplier.nome_fornecedor);
    }
    if (supplier.cnpj) {
      fields.push('cnpj = ?');
      values.push(supplier.cnpj);
    }
    if (supplier.nome_responsavel) {
      fields.push('nome_responsavel = ?');
      values.push(supplier.nome_responsavel);
    }
    if (supplier.telefone) {
      fields.push('telefone = ?');
      values.push(supplier.telefone);
    }
    if (supplier.endereco) {
      fields.push('endereco = ?');
      values.push(supplier.endereco);
    }
    if (supplier.valor_orcamento) {
      fields.push('valor_orcamento = ?');
      values.push(supplier.valor_orcamento);
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE fornecedores SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.getSupplierById(id);
  }

  async deleteSupplier(id: number): Promise<void> {
    await pool.execute('DELETE FROM fornecedores WHERE id = ?', [id]);
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
    // Garantir que valores undefined sejam convertidos para null
    const cleanData = {
      codigo_loja: store.codigo_loja || null,
      nome_loja: store.nome_loja || null,
      nome_operador: store.nome_operador || null,
      logradouro: store.logradouro || null,
      numero: store.numero || null,
      complemento: store.complemento || null,
      bairro: store.bairro || null,
      cidade: store.cidade || null,
      uf: store.uf || null,
      cep: store.cep || null,
      regiao: store.regiao || null,
      telefone_loja: store.telefone_loja || null
    };

    await pool.execute(
      `INSERT INTO lojas (codigo_loja, nome_loja, nome_operador, logradouro, numero, complemento, bairro, cidade, uf, cep, regiao, telefone_loja)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanData.codigo_loja,
        cleanData.nome_loja,
        cleanData.nome_operador,
        cleanData.logradouro,
        cleanData.numero,
        cleanData.complemento,
        cleanData.bairro,
        cleanData.cidade,
        cleanData.uf,
        cleanData.cep,
        cleanData.regiao,
        cleanData.telefone_loja
      ]
    );
    
    return cleanData as Store;
  }

  async getAllStores(): Promise<Store[]> {
    const [rows] = await pool.execute('SELECT * FROM lojas') as [RowDataPacket[], any];
    return rows as Store[];
  }

  async getStoreById(codigo_loja: string): Promise<Store> {
    const [rows] = await pool.execute(
      'SELECT * FROM lojas WHERE codigo_loja = ?',
      [codigo_loja]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Store;
  }

  async updateStore(codigo_loja: string, store: Partial<InsertStore>): Promise<Store> {
    const fields = [];
    const values = [];
    
    if (store.nome_loja !== undefined) {
      fields.push('nome_loja = ?');
      values.push(store.nome_loja || null);
    }
    if (store.nome_operador !== undefined) {
      fields.push('nome_operador = ?');
      values.push(store.nome_operador || null);
    }
    if (store.logradouro !== undefined) {
      fields.push('logradouro = ?');
      values.push(store.logradouro || null);
    }
    if (store.numero !== undefined) {
      fields.push('numero = ?');
      values.push(store.numero || null);
    }
    if (store.complemento !== undefined) {
      fields.push('complemento = ?');
      values.push(store.complemento || null);
    }
    if (store.bairro !== undefined) {
      fields.push('bairro = ?');
      values.push(store.bairro || null);
    }
    if (store.cidade !== undefined) {
      fields.push('cidade = ?');
      values.push(store.cidade || null);
    }
    if (store.uf !== undefined) {
      fields.push('uf = ?');
      values.push(store.uf || null);
    }
    if (store.cep !== undefined) {
      fields.push('cep = ?');
      values.push(store.cep || null);
    }
    if (store.regiao !== undefined) {
      fields.push('regiao = ?');
      values.push(store.regiao || null);
    }
    if (store.telefone_loja !== undefined) {
      fields.push('telefone_loja = ?');
      values.push(store.telefone_loja || null);
    }
    
    values.push(codigo_loja);
    
    await pool.execute(
      `UPDATE lojas SET ${fields.join(', ')} WHERE codigo_loja = ?`,
      values
    );
    
    return this.getStoreById(codigo_loja);
  }

  async deleteStore(codigo_loja: string): Promise<void> {
    await pool.execute('DELETE FROM lojas WHERE codigo_loja = ?', [codigo_loja]);
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

  async resolveTicket(id: number): Promise<void> {
    await pool.execute(
      'UPDATE chamados SET status = "resolvido" WHERE id = ?',
      [id]
    );
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

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [rows] = await pool.execute(
      'SELECT * FROM admins WHERE email = ?',
      [email]
    ) as [RowDataPacket[], any];
    
    return rows.length > 0 ? rows[0] as Admin : undefined;
  }

  async updateAdmin(id: number, admin: Partial<InsertAdmin>): Promise<Admin> {
    const fields = [];
    const values = [];
    
    if (admin.nome) {
      fields.push('nome = ?');
      values.push(admin.nome);
    }
    if (admin.email) {
      fields.push('email = ?');
      values.push(admin.email);
    }
    if (admin.senha) {
      fields.push('senha = ?');
      values.push(admin.senha);
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE admins SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    const [rows] = await pool.execute(
      'SELECT * FROM admins WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Admin;
  }

  async deleteAdmin(id: number): Promise<void> {
    await pool.execute('DELETE FROM admins WHERE id = ?', [id]);
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
      photos: typeof result.photos === 'string' ? JSON.parse(result.photos || '[]') : (result.photos || [])
    } as Installation;
  }

  async getDashboardMetrics(): Promise<{
    totalSuppliers: number;
    totalStores: number;
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    completedInstallations: number;
    unusedKits: number;
    monthlyInstallations: number[];
    ticketsByStatus: { open: number; resolved: number };
    unusedKitsList: any[];
  }> {
    const [supplierRows] = await pool.execute('SELECT COUNT(*) as count FROM fornecedores') as [RowDataPacket[], any];
    const [storeRows] = await pool.execute('SELECT COUNT(*) as count FROM lojas') as [RowDataPacket[], any];
    const [ticketRows] = await pool.execute('SELECT COUNT(*) as count FROM chamados') as [RowDataPacket[], any];
    
    // Status dos tickets
    const [openTicketsRows] = await pool.execute('SELECT COUNT(*) as count FROM chamados WHERE status = "aberto"') as [RowDataPacket[], any];
    const [resolvedTicketsRows] = await pool.execute('SELECT COUNT(*) as count FROM chamados WHERE status = "resolvido"') as [RowDataPacket[], any];

    // Instalações completas - instalacoes com dados preenchidos que correspondem ao codigo_loja das lojas
    const [completedInstallationsRows] = await pool.execute(`
      SELECT COUNT(DISTINCT i.loja_id) as count 
      FROM instalacoes i 
      INNER JOIN lojas l ON i.loja_id = l.codigo_loja 
      WHERE i.photos IS NOT NULL AND i.photos != ''
    `) as [RowDataPacket[], any];

    // Kits não usados - contagem total de kits (como exemplo)
    const [unusedKitsRows] = await pool.execute('SELECT COUNT(*) as count FROM kits') as [RowDataPacket[], any];
    
    // Lista de kits para subcategoria
    const [unusedKitsListRows] = await pool.execute('SELECT * FROM kits LIMIT 10') as [RowDataPacket[], any];

    return {
      totalSuppliers: supplierRows[0].count,
      totalStores: storeRows[0].count,
      totalTickets: ticketRows[0].count,
      openTickets: openTicketsRows[0].count,
      resolvedTickets: resolvedTicketsRows[0].count,
      completedInstallations: completedInstallationsRows[0].count,
      unusedKits: unusedKitsRows[0].count,
      monthlyInstallations: [15, 23, 18, 31, 28, 19], // Dados exemplo para 6 meses
      ticketsByStatus: {
        open: openTicketsRows[0].count,
        resolved: resolvedTicketsRows[0].count,
      },
      unusedKitsList: unusedKitsListRows,
    };
  }
}

export const storage = new MySQLStorage();