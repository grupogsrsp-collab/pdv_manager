import { pool, testConnection } from './mysql-db';
import { 
  Supplier, 
  InsertSupplier, 
  SupplierEmployee,
  InsertSupplierEmployee,
  Store, 
  InsertStore, 
  Kit, 
  InsertKit, 
  Ticket, 
  InsertTicket, 
  Admin, 
  InsertAdmin, 
  FotoFinal, 
  InsertFotoFinal,
  FotoOriginalLoja,
  InsertFotoOriginalLoja, 
  Installation, 
  InsertInstallation 
} from '../shared/mysql-schema';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface IStorage {
  // Suppliers
  getSupplierByCnpj(cnpj: string): Promise<Supplier | undefined>;
  getSupplierByCpf(cpf: string): Promise<Supplier | undefined>;
  getSupplierById(id: number): Promise<Supplier>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;
  getAllSuppliers(): Promise<Supplier[]>;
  
  // Supplier Employees
  getSupplierEmployees(supplierId: number): Promise<SupplierEmployee[]>;
  createSupplierEmployee(employee: InsertSupplierEmployee): Promise<SupplierEmployee>;
  updateSupplierEmployee(id: number, employee: Partial<InsertSupplierEmployee>): Promise<SupplierEmployee>;
  deleteSupplierEmployee(id: number): Promise<void>;
  
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
  
  // Fotos Finais (depois da instalação)
  getFotosFinaisByStoreId(loja_id: string): Promise<FotoFinal[]>;
  createFotoFinal(foto: InsertFotoFinal): Promise<FotoFinal>;
  getAllFotosFinaisWithDetails(): Promise<any[]>;
  
  // Fotos Originais da Loja (antes da instalação)
  getFotosOriginaisByStoreId(loja_id: string): Promise<FotoOriginalLoja[]>;
  createFotoOriginalLoja(foto: InsertFotoOriginalLoja): Promise<FotoOriginalLoja>;
  getAllFotosOriginaisWithDetails(): Promise<any[]>;
  
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

  private async ensureTableStructure() {
    try {
      // Verificar se a coluna cpf existe na tabela fornecedores
      const [supplierColumns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'rodr1657_pdv_manager' 
        AND TABLE_NAME = 'fornecedores'
      `) as [RowDataPacket[], any];
      
      const supplierColumnNames = supplierColumns.map((col: any) => col.COLUMN_NAME);
      console.log('Colunas existentes na tabela fornecedores:', supplierColumnNames);
      
      // Adicionar coluna cpf se não existir
      if (!supplierColumnNames.includes('cpf')) {
        console.log('Adicionando coluna cpf...');
        await pool.execute('ALTER TABLE fornecedores ADD COLUMN cpf VARCHAR(14)');
      }
      
      // Adicionar coluna estado se não existir
      if (!supplierColumnNames.includes('estado')) {
        console.log('Adicionando coluna estado...');
        await pool.execute('ALTER TABLE fornecedores ADD COLUMN estado VARCHAR(2)');
      }
      
      // Adicionar coluna email se não existir
      if (!supplierColumnNames.includes('email')) {
        console.log('Adicionando coluna email...');
        await pool.execute('ALTER TABLE fornecedores ADD COLUMN email VARCHAR(255)');
      }
      
      // Verificar e migrar estrutura da tabela instalacoes
      const [installationColumns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'rodr1657_pdv_manager' 
        AND TABLE_NAME = 'instalacoes'
      `) as [RowDataPacket[], any];
      
      const installationColumnNames = installationColumns.map((col: any) => col.COLUMN_NAME);
      console.log('Colunas existentes na tabela instalacoes:', installationColumnNames);
      
      // Migrar de photos para fotosOriginais e fotosFinais
      if (installationColumnNames.includes('photos') && !installationColumnNames.includes('fotosOriginais')) {
        console.log('Migrando estrutura da tabela instalacoes...');
        
        // Adicionar novas colunas
        await pool.execute('ALTER TABLE instalacoes ADD COLUMN fotosOriginais JSON');
        await pool.execute('ALTER TABLE instalacoes ADD COLUMN fotosFinais JSON');
        await pool.execute('ALTER TABLE instalacoes ADD COLUMN justificativaFotos TEXT');
        
        // Migrar dados existentes (photos -> fotosFinais)
        await pool.execute('UPDATE instalacoes SET fotosFinais = photos WHERE photos IS NOT NULL');
        
        // Remover coluna antiga
        await pool.execute('ALTER TABLE instalacoes DROP COLUMN photos');
        
        console.log('✅ Migração da tabela instalacoes concluída!');
      } else if (!installationColumnNames.includes('fotosOriginais')) {
        // Adicionar colunas se não existirem
        console.log('Adicionando colunas na tabela instalacoes...');
        await pool.execute('ALTER TABLE instalacoes ADD COLUMN fotosOriginais JSON');
        await pool.execute('ALTER TABLE instalacoes ADD COLUMN fotosFinais JSON');
        await pool.execute('ALTER TABLE instalacoes ADD COLUMN justificativaFotos TEXT');
      }

      // Adicionar colunas de geolocalização se não existirem
      if (!installationColumnNames.includes('latitude')) {
        console.log('Adicionando colunas de geolocalização...');
        await pool.execute('ALTER TABLE instalacoes ADD COLUMN latitude DECIMAL(10, 8)');
        await pool.execute('ALTER TABLE instalacoes ADD COLUMN longitude DECIMAL(11, 8)');
        await pool.execute('ALTER TABLE instalacoes ADD COLUMN endereco_geolocalizacao TEXT');
        await pool.execute('ALTER TABLE instalacoes ADD COLUMN mapa_screenshot_url VARCHAR(500)');
        await pool.execute('ALTER TABLE instalacoes ADD COLUMN geolocalizacao_timestamp TIMESTAMP');
        console.log('✅ Colunas de geolocalização adicionadas!');
      }
      
      console.log('✅ Estrutura da tabela verificada e corrigida!');
    } catch (error) {
      console.log('Erro ao verificar estrutura da tabela:', error);
    }
  }

  private async initializeTables() {
    try {
      await testConnection();
      
      // Verificar e corrigir estrutura da tabela primeiro
      await this.ensureTableStructure();
      
      // Criar tabelas se não existirem
      const tables = [
        `CREATE TABLE IF NOT EXISTS fornecedores (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome_fornecedor VARCHAR(255),
          cnpj VARCHAR(18),
          cpf VARCHAR(14),
          nome_responsavel VARCHAR(255),
          telefone VARCHAR(20),
          endereco TEXT,
          estado VARCHAR(2),
          email VARCHAR(255),
          valor_orcamento DECIMAL(10,2),
          UNIQUE KEY unique_cnpj (cnpj)
        )`,
        
        `CREATE TABLE IF NOT EXISTS funcionarios_fornecedores (
          id INT AUTO_INCREMENT PRIMARY KEY,
          fornecedor_id INT NOT NULL,
          nome_funcionario VARCHAR(255) NOT NULL,
          cpf VARCHAR(14) NOT NULL,
          telefone VARCHAR(20) NOT NULL,
          FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE CASCADE
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
        
        `CREATE TABLE IF NOT EXISTS fotos_finais (
          id INT AUTO_INCREMENT PRIMARY KEY,
          loja_id VARCHAR(20) NOT NULL,
          foto_url VARCHAR(500) NOT NULL,
          kit_id INT,
          FOREIGN KEY (loja_id) REFERENCES lojas(codigo_loja),
          FOREIGN KEY (kit_id) REFERENCES kits(id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS fotos_originais_loja (
          id INT AUTO_INCREMENT PRIMARY KEY,
          loja_id VARCHAR(20) NOT NULL,
          foto_url VARCHAR(500) NOT NULL,
          kit_id INT NOT NULL,
          FOREIGN KEY (loja_id) REFERENCES lojas(codigo_loja),
          FOREIGN KEY (kit_id) REFERENCES kits(id)
        )`, 
        
        `CREATE TABLE IF NOT EXISTS instalacoes (
          id VARCHAR(36) PRIMARY KEY,
          loja_id VARCHAR(20) NOT NULL,
          fornecedor_id INT NOT NULL,
          responsible VARCHAR(255) NOT NULL,
          installationDate VARCHAR(20) NOT NULL,
          fotosOriginais JSON,
          fotosFinais JSON,
          justificativaFotos TEXT,
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
          ['SuperTech Supplies', '12345678000190', '12345678901', 'João Silva', '(11) 99999-9999', 'Rua das Flores, 123', 'SP', 15000.00],
          ['ABC Ferramentas', '98765432000110', '98765432100', 'Maria Costa', '(11) 88888-8888', 'Av. Industrial, 456', 'RJ', 25000.00]
        ];
        
        for (const supplier of suppliers) {
          await pool.execute(
            `INSERT INTO fornecedores (nome_fornecedor, cnpj, cpf, nome_responsavel, telefone, endereco, estado, valor_orcamento) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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

      // Inserir kits de exemplo
      const [kitRows] = await pool.execute(
        'SELECT COUNT(*) as count FROM kits'
      ) as [RowDataPacket[], any];
      
      if (kitRows[0].count <= 1) {
        // Limpar dados antigos se houver apenas 1 ou menos
        await pool.execute('DELETE FROM kits');
        
        const kits = [
          ['Kit Básico de Instalação', 'Kit com ferramentas básicas para instalação', 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=Kit+Básico'],
          ['Cabo HDMI Premium', 'Cabo HDMI 4K de alta qualidade 2 metros', 'https://via.placeholder.com/300x300/059669/FFFFFF?text=Cabo+HDMI'],
          ['Suporte de Parede Universal', 'Suporte ajustável para TVs de 32" a 65"', 'https://via.placeholder.com/300x300/DC2626/FFFFFF?text=Suporte'],
          ['Kit de Parafusos', 'Conjunto completo de parafusos e buchas', 'https://via.placeholder.com/300x300/7C2D12/FFFFFF?text=Parafusos'],
          ['Organizador de Cabos', 'Sistema de organização para cabos', 'https://via.placeholder.com/300x300/1F2937/FFFFFF?text=Organizador'],
          ['Testador de Sinal', 'Equipamento para teste de sinal digital', 'https://via.placeholder.com/300x300/7C3AED/FFFFFF?text=Testador']
        ];

        for (const kit of kits) {
          await pool.execute(
            `INSERT INTO kits (nome_peca, descricao, image_url, sim, nao) 
             VALUES (?, ?, ?, 0, 0)`,
            kit
          );
        }
        console.log('✅ 6 kits de exemplo inseridos com sucesso!');
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

  async getSupplierByCpf(cpf: string): Promise<Supplier | undefined> {
    const cleanCpf = cpf.replace(/[.\-\s]/g, '');
    const [rows] = await pool.execute(
      'SELECT * FROM fornecedores WHERE REPLACE(REPLACE(cpf, ".", ""), "-", "") = ?',
      [cleanCpf]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Supplier | undefined;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [result] = await pool.execute(
      `INSERT INTO fornecedores (nome_fornecedor, cnpj, cpf, nome_responsavel, telefone, endereco, estado, email, valor_orcamento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [supplier.nome_fornecedor || '', supplier.cnpj || '', supplier.cpf || '', supplier.nome_responsavel || '', supplier.telefone || '', supplier.endereco || '', supplier.estado || '', supplier.email || '', supplier.valor_orcamento || 0]
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
    if (supplier.cpf) {
      fields.push('cpf = ?');
      values.push(supplier.cpf);
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
    if (supplier.estado) {
      fields.push('estado = ?');
      values.push(supplier.estado);
    }
    if (supplier.email) {
      fields.push('email = ?');
      values.push(supplier.email);
    }
    if (supplier.valor_orcamento !== undefined) {
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
    // Primeiro, excluir registros relacionados que dependem deste fornecedor
    try {
      // Primeiro, verificar se a coluna aceita NULL e modificar se necessário
      await pool.execute(`
        ALTER TABLE instalacoes 
        MODIFY COLUMN fornecedor_id INT NULL
      `);
      
      // Excluir funcionários do fornecedor
      await pool.execute('DELETE FROM funcionarios_fornecedores WHERE fornecedor_id = ?', [id]);
      
      // Atualizar chamados para remover a referência ao fornecedor (ao invés de excluir)
      await pool.execute('UPDATE chamados SET fornecedor_id = NULL WHERE fornecedor_id = ?', [id]);
      
      // Atualizar instalações para remover a referência ao fornecedor (ao invés de excluir)
      await pool.execute('UPDATE instalacoes SET fornecedor_id = NULL WHERE fornecedor_id = ?', [id]);
      
      // Agora excluir o fornecedor
      await pool.execute('DELETE FROM fornecedores WHERE id = ?', [id]);
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      throw error;
    }
  }

  async getStoreByCode(codigo_loja: string): Promise<Store | undefined> {
    const [rows] = await pool.execute(
      'SELECT * FROM lojas WHERE codigo_loja = ?',
      [codigo_loja]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Store | undefined;
  }

  async getStoresByFilters(filters: any): Promise<Store[]> {
    let query = 'SELECT * FROM lojas WHERE 1=1';
    const params: any[] = [];

    console.log("Filtros recebidos no storage:", filters);

    // Mapear filtros do frontend para campos do banco
    if (filters.code) {
      query += ' AND codigo_loja LIKE ?';
      params.push(`%${filters.code}%`);
    }
    if (filters.cep) {
      // Remove formatação do CEP para busca
      const cleanCep = filters.cep.replace(/\D/g, '');
      query += ' AND cep LIKE ?';
      params.push(`%${cleanCep}%`);
    }
    if (filters.city) {
      query += ' AND cidade LIKE ?';
      params.push(`%${filters.city}%`);
    }
    if (filters.state) {
      query += ' AND uf LIKE ?';
      params.push(`%${filters.state}%`);
    }
    if (filters.address) {
      query += ' AND (logradouro LIKE ? OR bairro LIKE ?)';
      params.push(`%${filters.address}%`, `%${filters.address}%`);
    }

    console.log("Query final:", query);
    console.log("Parâmetros:", params);

    const [rows] = await pool.execute(query, params) as [RowDataPacket[], any];
    console.log("Resultados encontrados:", rows.length);
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

  async getStoreInstallationStatus(codigo_loja: string): Promise<{
    isInstalled: boolean;
    installation?: any;
    supplier?: Supplier;
  }> {
    // Check if store has installation (get the most recent one)
    const [installationRows] = await pool.execute(
      'SELECT * FROM instalacoes WHERE loja_id = ? ORDER BY id DESC LIMIT 1',
      [codigo_loja]
    ) as [RowDataPacket[], any];

    const installation = installationRows[0];
    
    if (!installation) {
      return { isInstalled: false };
    }

    // Get supplier info if installation exists
    const [supplierRows] = await pool.execute(
      'SELECT * FROM fornecedores WHERE id = ?',
      [installation.fornecedor_id]
    ) as [RowDataPacket[], any];

    const supplier = supplierRows[0] as Supplier;

    return {
      isInstalled: true,
      installation,
      supplier
    };
  }

  async getStoreCompleteInfo(codigo_loja: string): Promise<{
    store: Store;
    installationStatus: {
      isInstalled: boolean;
      installation?: any;
      supplier?: Supplier;
    };
  } | null> {
    const store = await this.getStoreByCode(codigo_loja);
    if (!store) return null;

    const installationStatus = await this.getStoreInstallationStatus(codigo_loja);

    return {
      store,
      installationStatus
    };
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
    // If fornecedor_id is provided, use it; otherwise, set to NULL
    const fornecedorId = ticket.fornecedor_id || null;
    
    const [result] = await pool.execute(
      'INSERT INTO chamados (descricao, status, loja_id, fornecedor_id, data_abertura) VALUES (?, ?, ?, ?, ?)',
      [ticket.descricao, ticket.status, ticket.loja_id, fornecedorId, ticket.data_abertura || new Date()]
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

  async updateKitUsage(id: number, action: 'sim' | 'nao'): Promise<Kit> {
    const column = action === 'sim' ? 'sim' : 'nao';
    
    await pool.execute(
      `UPDATE kits SET ${column} = ${column} + 1 WHERE id = ?`,
      [id]
    );
    
    const [rows] = await pool.execute(
      'SELECT * FROM kits WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Kit;
  }

  async createKit(kit: InsertKit): Promise<Kit> {
    const [result] = await pool.execute(
      'INSERT INTO kits (nome_peca, descricao, image_url, sim, nao) VALUES (?, ?, ?, 0, 0)',
      [kit.nome_peca, kit.descricao, kit.image_url || null]
    ) as [ResultSetHeader, any];

    const [rows] = await pool.execute(
      'SELECT * FROM kits WHERE id = ?',
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Kit;
  }

  async updateKit(id: number, kit: Partial<InsertKit>): Promise<Kit> {
    const fields = [];
    const values = [];
    
    if (kit.nome_peca !== undefined) {
      fields.push('nome_peca = ?');
      values.push(kit.nome_peca);
    }
    if (kit.descricao !== undefined) {
      fields.push('descricao = ?');
      values.push(kit.descricao);
    }
    if (kit.image_url !== undefined) {
      fields.push('image_url = ?');
      values.push(kit.image_url);
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE kits SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    const [rows] = await pool.execute(
      'SELECT * FROM kits WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Kit;
  }

  async deleteKit(id: number): Promise<void> {
    await pool.execute('DELETE FROM kits WHERE id = ?', [id]);
  }

  async getFotosFinaisByStoreId(loja_id: string): Promise<FotoFinal[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM fotos_finais WHERE loja_id = ?',
      [loja_id]
    ) as [RowDataPacket[], any];
    
    return rows as FotoFinal[];
  }

  async createFotoFinal(foto: InsertFotoFinal): Promise<FotoFinal> {
    const [result] = await pool.execute(
      'INSERT INTO fotos_finais (loja_id, foto_url, kit_id) VALUES (?, ?, ?)',
      [foto.loja_id, foto.foto_url, foto.kit_id || null]
    ) as [ResultSetHeader, any];

    const [rows] = await pool.execute(
      'SELECT * FROM fotos_finais WHERE id = ?',
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    return rows[0] as FotoFinal;
  }

  async getFotosOriginaisByStoreId(loja_id: string): Promise<FotoOriginalLoja[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM fotos_originais_loja WHERE loja_id = ?',
      [loja_id]
    ) as [RowDataPacket[], any];
    
    return rows as FotoOriginalLoja[];
  }

  async createFotoOriginalLoja(foto: InsertFotoOriginalLoja): Promise<FotoOriginalLoja> {
    const [result] = await pool.execute(
      'INSERT INTO fotos_originais_loja (loja_id, foto_url, kit_id) VALUES (?, ?, ?)',
      [foto.loja_id, foto.foto_url, foto.kit_id]
    ) as [ResultSetHeader, any];

    const [rows] = await pool.execute(
      'SELECT * FROM fotos_originais_loja WHERE id = ?',
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    return rows[0] as FotoOriginalLoja;
  }

  async getAllFotosOriginaisWithDetails(): Promise<any[]> {
    const [rows] = await pool.execute(`
      SELECT 
        fo.id as foto_id,
        fo.foto_url,
        fo.loja_id,
        l.nome_loja,
        l.cidade,
        l.uf,
        k.id as kit_id,
        k.nome_peca,
        k.descricao as kit_descricao,
        i.responsible as instalador,
        i.installationDate as data_instalacao,
        i.fornecedor_id,
        f.nome_fornecedor
      FROM fotos_originais_loja fo
      LEFT JOIN lojas l ON fo.loja_id = l.codigo_loja
      LEFT JOIN kits k ON fo.kit_id = k.id
      LEFT JOIN instalacoes i ON fo.loja_id = i.loja_id
      LEFT JOIN fornecedores f ON i.fornecedor_id = f.id
      ORDER BY fo.id DESC
    `) as [RowDataPacket[], any];
    
    return rows;
  }

  async getAllFotosFinaisWithDetails(): Promise<any[]> {
    const [rows] = await pool.execute(`
      SELECT 
        ff.id as foto_id,
        ff.foto_url,
        ff.loja_id,
        l.nome_loja,
        l.cidade,
        l.uf,
        k.id as kit_id,
        k.nome_peca,
        k.descricao as kit_descricao,
        i.responsible as instalador,
        i.installationDate as data_instalacao,
        i.fornecedor_id,
        f.nome_fornecedor
      FROM fotos_finais ff
      LEFT JOIN lojas l ON ff.loja_id = l.codigo_loja
      LEFT JOIN kits k ON ff.kit_id = k.id
      LEFT JOIN instalacoes i ON ff.loja_id = i.loja_id
      LEFT JOIN fornecedores f ON i.fornecedor_id = f.id
      ORDER BY ff.id DESC
    `) as [RowDataPacket[], any];
    
    return rows;
  }

  async getAllInstallations(): Promise<Installation[]> {
    const [rows] = await pool.execute('SELECT * FROM instalacoes') as [RowDataPacket[], any];
    return rows.map(row => {
      let fotosOriginais = [];
      let fotosFinais = [];
      
      try {
        if (row.fotosOriginais) {
          const fotosStr = String(row.fotosOriginais);
          // Tentar JSON primeiro
          if (fotosStr.startsWith('[')) {
            fotosOriginais = JSON.parse(fotosStr);
          } else if (fotosStr.startsWith('data:image/')) {
            // Se for uma única foto base64, converter para array
            fotosOriginais = [fotosStr];
          } else {
            fotosOriginais = [];
          }
        } else {
          fotosOriginais = [];
        }
      } catch (error) {
        console.log('Erro ao fazer parse das fotos originais:', error);
        fotosOriginais = [];
      }
      
      try {
        if (row.fotosFinais) {
          const fotosStr = String(row.fotosFinais);
          // Tentar JSON primeiro
          if (fotosStr.startsWith('[')) {
            fotosFinais = JSON.parse(fotosStr);
          } else if (fotosStr.startsWith('data:image/')) {
            // Se for uma única foto base64, converter para array
            fotosFinais = [fotosStr];
          } else {
            fotosFinais = [];
          }
        } else {
          fotosFinais = [];
        }
      } catch (error) {
        console.log('Erro ao fazer parse das fotos finais:', error);
        fotosFinais = [];
      }
      
      return {
        ...row,
        fotosOriginais,
        fotosFinais
      };
    }) as Installation[];
  }

  async getInstallationByStoreId(loja_id: string): Promise<Installation | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM instalacoes WHERE loja_id = ? ORDER BY createdAt DESC LIMIT 1',
      [loja_id]
    ) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    
    let fotosOriginais = [];
    let fotosFinais = [];
    
    try {
      if (row.fotosOriginais) {
        const fotosStr = String(row.fotosOriginais);
        // Tentar JSON primeiro
        if (fotosStr.startsWith('[')) {
          fotosOriginais = JSON.parse(fotosStr);
        } else if (fotosStr.startsWith('data:image/')) {
          // Se for uma única foto base64, converter para array
          fotosOriginais = [fotosStr];
        } else {
          fotosOriginais = [];
        }
      } else {
        fotosOriginais = [];
      }
    } catch (error) {
      console.log('Erro ao fazer parse das fotos originais:', error);
      fotosOriginais = [];
    }
    
    try {
      if (row.fotosFinais) {
        const fotosStr = String(row.fotosFinais);
        // Tentar JSON primeiro
        if (fotosStr.startsWith('[')) {
          fotosFinais = JSON.parse(fotosStr);
        } else if (fotosStr.startsWith('data:image/')) {
          // Se for uma única foto base64, converter para array
          fotosFinais = [fotosStr];
        } else {
          fotosFinais = [];
        }
      } else {
        fotosFinais = [];
      }
    } catch (error) {
      console.log('Erro ao fazer parse das fotos finais:', error);
      fotosFinais = [];
    }
    
    return {
      ...row,
      fotosOriginais,
      fotosFinais
    } as Installation;
  }

  async updateInstallation(id: string, installation: InsertInstallation): Promise<Installation> {
    const fotosOriginaisJson = JSON.stringify(installation.fotosOriginais || []);
    const fotosFinaisJson = JSON.stringify(installation.fotosFinais || []);
    
    // Atualizar instalação existente
    await pool.execute(
      `UPDATE instalacoes SET 
        fornecedor_id = ?,
        responsible = ?, 
        installationDate = ?, 
        fotosOriginais = ?, 
        fotosFinais = ?, 
        justificativaFotos = ?,
        latitude = ?,
        longitude = ?,
        endereco_geolocalizacao = ?,
        mapa_screenshot_url = ?,
        geolocalizacao_timestamp = ?
      WHERE id = ?`,
      [
        installation.fornecedor_id || null,
        installation.responsible,
        installation.installationDate,
        fotosOriginaisJson,
        fotosFinaisJson,
        installation.justificativaFotos || null,
        installation.latitude || null,
        installation.longitude || null,
        installation.endereco_geolocalizacao || null,
        installation.mapa_screenshot_url || null,
        installation.geolocalizacao_timestamp ? new Date(installation.geolocalizacao_timestamp) : null,
        id
      ]
    );

    // Buscar todos os kits para recriar associações de fotos
    const [kitsRows] = await pool.execute('SELECT * FROM kits ORDER BY id') as [RowDataPacket[], any];
    const kits = kitsRows as Kit[];

    // Remover fotos antigas
    await pool.execute('DELETE FROM fotos_originais_loja WHERE loja_id = ?', [installation.loja_id]);
    await pool.execute('DELETE FROM fotos_finais WHERE loja_id = ?', [installation.loja_id]);

    // Salvar novas fotos originais individualmente
    if (installation.fotosOriginais && installation.fotosOriginais.length > 0) {
      for (let i = 0; i < installation.fotosOriginais.length; i++) {
        const foto = installation.fotosOriginais[i];
        const kit = kits[i];
        
        if (foto && kit) {
          await pool.execute(
            'INSERT INTO fotos_originais_loja (loja_id, foto_url, kit_id) VALUES (?, ?, ?)',
            [installation.loja_id, foto, kit.id]
          );
        }
      }
    }

    // Salvar novas fotos finais individualmente
    if (installation.fotosFinais && installation.fotosFinais.length > 0) {
      for (let i = 0; i < installation.fotosFinais.length; i++) {
        const foto = installation.fotosFinais[i];
        const kit = kits[i];
        
        if (foto && kit) {
          await pool.execute(
            'INSERT INTO fotos_finais (loja_id, foto_url, kit_id) VALUES (?, ?, ?)',
            [installation.loja_id, foto, kit.id]
          );
        }
      }
    }

    const [rows] = await pool.execute(
      'SELECT * FROM instalacoes WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];
    
    const result = rows[0];
    return {
      ...result,
      fotosOriginais: typeof result.fotosOriginais === 'string' ? JSON.parse(result.fotosOriginais || '[]') : (result.fotosOriginais || []),
      fotosFinais: typeof result.fotosFinais === 'string' ? JSON.parse(result.fotosFinais || '[]') : (result.fotosFinais || [])
    } as Installation;
  }

  async createInstallation(installation: InsertInstallation): Promise<Installation> {
    const id = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fotosOriginaisJson = JSON.stringify(installation.fotosOriginais || []);
    const fotosFinaisJson = JSON.stringify(installation.fotosFinais || []);
    
    // Salvar instalação principal
    await pool.execute(
      'INSERT INTO instalacoes (id, loja_id, fornecedor_id, responsible, installationDate, fotosOriginais, fotosFinais, justificativaFotos, latitude, longitude, endereco_geolocalizacao, mapa_screenshot_url, geolocalizacao_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, 
        installation.loja_id, 
        installation.fornecedor_id, 
        installation.responsible, 
        installation.installationDate, 
        fotosOriginaisJson, 
        fotosFinaisJson, 
        installation.justificativaFotos || null,
        installation.latitude || null,
        installation.longitude || null,
        installation.endereco_geolocalizacao || null,
        installation.mapa_screenshot_url || null,
        installation.geolocalizacao_timestamp ? new Date(installation.geolocalizacao_timestamp) : null
      ]
    );

    // Buscar todos os kits para associar às fotos
    const [kitsRows] = await pool.execute('SELECT * FROM kits ORDER BY id') as [RowDataPacket[], any];
    const kits = kitsRows as Kit[];

    // Salvar fotos originais individualmente
    if (installation.fotosOriginais && installation.fotosOriginais.length > 0) {
      for (let i = 0; i < installation.fotosOriginais.length; i++) {
        const foto = installation.fotosOriginais[i];
        const kit = kits[i]; // Associar foto ao kit pelo índice
        
        if (foto && kit) {
          await pool.execute(
            'INSERT INTO fotos_originais_loja (loja_id, foto_url, kit_id) VALUES (?, ?, ?)',
            [installation.loja_id, foto, kit.id]
          );
        }
      }
    }

    // Salvar fotos finais individuamente
    if (installation.fotosFinais && installation.fotosFinais.length > 0) {
      for (let i = 0; i < installation.fotosFinais.length; i++) {
        const foto = installation.fotosFinais[i];
        const kit = kits[i]; // Associar foto ao kit pelo índice
        
        if (foto && kit) {
          await pool.execute(
            'INSERT INTO fotos_finais (loja_id, foto_url, kit_id) VALUES (?, ?, ?)',
            [installation.loja_id, foto, kit.id]
          );
        }
      }
    }

    const [rows] = await pool.execute(
      'SELECT * FROM instalacoes WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];
    
    const result = rows[0];
    return {
      ...result,
      fotosOriginais: typeof result.fotosOriginais === 'string' ? JSON.parse(result.fotosOriginais || '[]') : (result.fotosOriginais || []),
      fotosFinais: typeof result.fotosFinais === 'string' ? JSON.parse(result.fotosFinais || '[]') : (result.fotosFinais || [])
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

  // Supplier Employees methods
  async getSupplierEmployees(supplierId: number): Promise<SupplierEmployee[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM funcionarios_fornecedores WHERE fornecedor_id = ?',
      [supplierId]
    ) as [RowDataPacket[], any];
    
    return rows as SupplierEmployee[];
  }

  async createSupplierEmployee(employee: InsertSupplierEmployee): Promise<SupplierEmployee> {
    const [result] = await pool.execute(
      'INSERT INTO funcionarios_fornecedores (fornecedor_id, nome_funcionario, cpf, telefone) VALUES (?, ?, ?, ?)',
      [employee.fornecedor_id, employee.nome_funcionario, employee.cpf, employee.telefone]
    ) as [ResultSetHeader, any];

    const [rows] = await pool.execute(
      'SELECT * FROM funcionarios_fornecedores WHERE id = ?',
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    return rows[0] as SupplierEmployee;
  }

  async updateSupplierEmployee(id: number, employee: Partial<InsertSupplierEmployee>): Promise<SupplierEmployee> {
    const fields = [];
    const values = [];
    
    if (employee.nome_funcionario) {
      fields.push('nome_funcionario = ?');
      values.push(employee.nome_funcionario);
    }
    if (employee.cpf) {
      fields.push('cpf = ?');
      values.push(employee.cpf);
    }
    if (employee.telefone) {
      fields.push('telefone = ?');
      values.push(employee.telefone);
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE funcionarios_fornecedores SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    const [rows] = await pool.execute(
      'SELECT * FROM funcionarios_fornecedores WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];
    
    return rows[0] as SupplierEmployee;
  }

  async deleteSupplierEmployee(id: number): Promise<void> {
    await pool.execute('DELETE FROM funcionarios_fornecedores WHERE id = ?', [id]);
  }

  async getSupplierEmployeeCounts(): Promise<Record<number, number>> {
    const [rows] = await pool.execute(`
      SELECT fornecedor_id, COUNT(*) as count 
      FROM funcionarios_fornecedores 
      GROUP BY fornecedor_id
    `) as [RowDataPacket[], any];
    
    const counts: Record<number, number> = {};
    (rows as any[]).forEach(row => {
      counts[row.fornecedor_id] = parseInt(row.count);
    });
    
    return counts;
  }
}

export const storage = new MySQLStorage();