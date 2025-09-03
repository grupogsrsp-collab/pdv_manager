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
  InsertInstallation,
  Route,
  InsertRoute,
  RouteItem,
  InsertRouteItem
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
  
  // Store Locations
  getStoreLocations(): Promise<{ estados: string[]; cidades: string[]; bairros: string[] }>;
  getCitiesByState(estado: string): Promise<string[]>;
  getNeighborhoodsByCity(estado: string, cidade: string): Promise<string[]>;
  
  // Analytics
  getDashboardMetrics(filters?: { estado?: string; cidade?: string; bairro?: string }): Promise<{
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
      
      // CORREÇÃO CRÍTICA: Alterar colunas de fotos para LONGTEXT para suportar base64 grandes
      console.log('🔧 Verificando e corrigindo tipos de colunas de fotos...');
      
      // Corrigir tabela fotos_loja_especificas - usar LONGTEXT para suportar imagens grandes
      try {
        await pool.execute(`
          ALTER TABLE fotos_loja_especificas 
          MODIFY COLUMN url_foto_frente_loja LONGTEXT,
          MODIFY COLUMN url_foto_interna_loja LONGTEXT,
          MODIFY COLUMN url_foto_interna_lado_direito LONGTEXT,
          MODIFY COLUMN url_foto_interna_lado_esquerdo LONGTEXT
        `);
        console.log('✅ Colunas de fotos_loja_especificas alteradas para LONGTEXT');
      } catch (e: any) {
        if (!e.message?.includes('Table') && !e.message?.includes('Unknown')) {
          console.log('ℹ️ Colunas de fotos_loja_especificas:', e.message);
        }
      }
      
      // Corrigir tabela fotos_finais - usar LONGTEXT
      try {
        await pool.execute(`
          ALTER TABLE fotos_finais 
          MODIFY COLUMN foto_url LONGTEXT
        `);
        console.log('✅ Coluna foto_url de fotos_finais alterada para LONGTEXT');
      } catch (e: any) {
        if (!e.message?.includes('Table') && !e.message?.includes('Unknown')) {
          console.log('ℹ️ Coluna foto_url de fotos_finais:', e.message);
        }
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
      
      // Verificar e adicionar coluna finalizada se não existir
      try {
        console.log('📝 Verificando se coluna finalizada existe...');
        await pool.execute('ALTER TABLE instalacoes ADD COLUMN finalizada BOOLEAN DEFAULT FALSE');
        console.log('✅ Coluna finalizada adicionada com sucesso!');
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('ℹ️ Coluna finalizada já existe na tabela instalacoes');
        } else {
          console.log('⚠️ Erro ao adicionar coluna finalizada:', error.message);
        }
      }

      // Verificar e corrigir estrutura da tabela chamados
      try {
        console.log('📝 Verificando estrutura da tabela chamados...');
        
        // Primeiro, tentar remover foreign key constraints se existirem
        try {
          await pool.execute('ALTER TABLE chamados DROP FOREIGN KEY chamados_ibfk_1');
          console.log('🔑 Foreign key constraint removida');
        } catch (e) {
          // Ignorar se não existir
        }

        try {
          await pool.execute('ALTER TABLE chamados DROP FOREIGN KEY chamados_ibfk_2');
          console.log('🔑 Segunda foreign key constraint removida');
        } catch (e) {
          // Ignorar se não existir
        }
        
        // Verificar colunas existentes
        const [chamadosColumns] = await pool.execute(
          `SHOW COLUMNS FROM chamados`
        ) as [RowDataPacket[], any];

        const existingCols = chamadosColumns.map(col => col.Field);
        
        if (!existingCols.includes('instalador')) {
          console.log('📝 Adicionando coluna instalador à tabela chamados...');
          await pool.execute(
            'ALTER TABLE chamados ADD COLUMN instalador VARCHAR(255)'
          );
        }
        
        if (!existingCols.includes('data_ocorrencia')) {
          console.log('📝 Adicionando coluna data_ocorrencia à tabela chamados...');
          await pool.execute(
            'ALTER TABLE chamados ADD COLUMN data_ocorrencia DATE'
          );
        }

        // Alterar loja_id para VARCHAR se for INT
        const lojaIdCol = chamadosColumns.find(col => col.Field === 'loja_id');
        if (lojaIdCol && lojaIdCol.Type.includes('int')) {
          console.log('📝 Alterando tipo da coluna loja_id para VARCHAR...');
          await pool.execute(
            'ALTER TABLE chamados MODIFY loja_id VARCHAR(20)'
          );
        }
        
        console.log('✅ Estrutura da tabela chamados verificada e corrigida!');
      } catch (error: any) {
        console.log('⚠️ Erro ao verificar estrutura da tabela chamados:', error.message);
      }
      
      // Criar tabelas de rotas
      await this.createRoutesTables();
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
          loja_id VARCHAR(20) NOT NULL,
          descricao TEXT NOT NULL,
          instalador VARCHAR(255) NOT NULL,
          data_ocorrencia DATE NOT NULL,
          fornecedor_id INT NOT NULL,
          status VARCHAR(20) DEFAULT 'aberto',
          data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        
        // Tabela para as 4 fotos específicas da loja
        `CREATE TABLE IF NOT EXISTS fotos_loja_especificas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          loja_id VARCHAR(20) NOT NULL,
          id_instalacao INT,
          url_foto_frente_loja VARCHAR(500),
          url_foto_interna_loja VARCHAR(500),
          url_foto_interna_lado_direito VARCHAR(500),
          url_foto_interna_lado_esquerdo VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (loja_id) REFERENCES lojas(codigo_loja),
          UNIQUE KEY unique_loja_instalacao (loja_id, id_instalacao)
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
          finalizada BOOLEAN DEFAULT FALSE,
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
      
      // Criar dados de teste para rotas
      await this.createTestDataForRoutes();
      
    } catch (error) {
      console.log('ℹ️ Dados de exemplo já existem ou erro na inserção:', error);
    }
  }

  private async createRoutesTables(): Promise<void> {
    try {
      console.log('📝 Criando tabelas de rotas...');
      
      // Criar tabela rotas
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS rotas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          fornecedor_id INT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'ativa',
          observacoes TEXT,
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          data_prevista DATE,
          data_execucao DATE,
          created_by INT NOT NULL,
          FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id),
          INDEX idx_fornecedor_id (fornecedor_id),
          INDEX idx_status (status)
        )
      `);
      
      // Criar tabela rota_itens
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS rota_itens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          rota_id INT NOT NULL,
          loja_id VARCHAR(20) NOT NULL,
          ordem_visita INT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pendente',
          data_prevista DATE,
          data_execucao DATE,
          observacoes TEXT,
          tempo_estimado INT, -- em minutos
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (rota_id) REFERENCES rotas(id) ON DELETE CASCADE,
          FOREIGN KEY (loja_id) REFERENCES lojas(codigo_loja),
          INDEX idx_rota_id (rota_id),
          INDEX idx_loja_id (loja_id),
          INDEX idx_status (status)
        )
      `);
      
      // Criar tabela rota_funcionarios
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS rota_funcionarios (
          id INT AUTO_INCREMENT PRIMARY KEY,
          rota_id INT NOT NULL,
          funcionario_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (rota_id) REFERENCES rotas(id) ON DELETE CASCADE,
          FOREIGN KEY (funcionario_id) REFERENCES funcionarios_fornecedores(id) ON DELETE CASCADE,
          UNIQUE KEY unique_rota_funcionario (rota_id, funcionario_id),
          INDEX idx_rota_id (rota_id),
          INDEX idx_funcionario_id (funcionario_id)
        )
      `);
      
      console.log('✅ Tabelas de rotas criadas com sucesso!');
    } catch (error) {
      console.log('⚠️ Erro ao criar tabelas de rotas:', error);
    }
  }

  // ============ MÉTODOS PARA ROTAS ============

  async createRoute(route: InsertRoute): Promise<Route> {
    const [result] = await pool.execute(
      `INSERT INTO rotas (nome, fornecedor_id, status, observacoes, data_prevista, data_execucao, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        route.nome, 
        route.fornecedor_id, 
        route.status || 'ativa', 
        route.observacoes || null, 
        route.data_prevista || null, 
        route.data_execucao || null, 
        route.created_by
      ]
    ) as [ResultSetHeader, any];
    
    const [rows] = await pool.execute(
      'SELECT * FROM rotas WHERE id = ?',
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Route;
  }

  async getRoutes(fornecedorId?: number): Promise<Route[]> {
    let query = 'SELECT * FROM rotas';
    const params = [];
    
    if (fornecedorId) {
      query += ' WHERE fornecedor_id = ?';
      params.push(fornecedorId);
    }
    
    query += ' ORDER BY data_criacao DESC';
    
    const [rows] = await pool.execute(query, params) as [RowDataPacket[], any];
    return rows as Route[];
  }

  async getRouteById(id: number): Promise<Route | undefined> {
    const [rows] = await pool.execute(
      'SELECT * FROM rotas WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Route | undefined;
  }

  async updateRoute(id: number, route: Partial<InsertRoute>): Promise<Route> {
    const fields = [];
    const values = [];
    
    if (route.nome) {
      fields.push('nome = ?');
      values.push(route.nome);
    }
    if (route.status) {
      fields.push('status = ?');
      values.push(route.status);
    }
    if (route.observacoes !== undefined) {
      fields.push('observacoes = ?');
      values.push(route.observacoes);
    }
    if (route.data_prevista !== undefined) {
      fields.push('data_prevista = ?');
      values.push(route.data_prevista);
    }
    if (route.data_execucao !== undefined) {
      fields.push('data_execucao = ?');
      values.push(route.data_execucao);
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE rotas SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    const [rows] = await pool.execute(
      'SELECT * FROM rotas WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];
    
    return rows[0] as Route;
  }

  async deleteRoute(id: number): Promise<void> {
    await pool.execute('DELETE FROM rotas WHERE id = ?', [id]);
  }

  async finishRoute(id: number): Promise<void> {
    await pool.execute('UPDATE rotas SET status = ? WHERE id = ?', ['finalizada', id]);
  }

  async getRouteStats(): Promise<any> {
    // Total de rotas finalizadas
    const [finalizadasRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM rotas WHERE status = 'finalizada'`
    ) as [RowDataPacket[], any];
    
    // Total de rotas ativas
    const [ativasRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM rotas WHERE status = 'ativa'`
    ) as [RowDataPacket[], any];
    
    // Total de lojas finalizadas (com instalação finalizada)
    const [lojasFinalizadasRows] = await pool.execute(
      `SELECT COUNT(DISTINCT inst.loja_id) as total 
       FROM instalacoes inst 
       WHERE inst.finalizada = 1`
    ) as [RowDataPacket[], any];
    
    // Total de lojas não finalizadas (lojas que estão em rotas mas não têm instalação finalizada)
    const [lojasNaoFinalizadasRows] = await pool.execute(
      `SELECT COUNT(DISTINCT ri.loja_id) as total
       FROM rota_itens ri
       LEFT JOIN instalacoes inst ON ri.loja_id = inst.loja_id AND inst.finalizada = 1
       WHERE inst.loja_id IS NULL`
    ) as [RowDataPacket[], any];
    
    return {
      rotasFinalizadas: finalizadasRows[0].total,
      rotasAtivas: ativasRows[0].total,
      lojasFinalizadas: lojasFinalizadasRows[0].total,
      lojasNaoFinalizadas: lojasNaoFinalizadasRows[0].total
    };
  }

  async searchSupplierOrEmployee(query: string): Promise<any[]> {
    const trimmedQuery = query.trim();
    const results: any[] = [];
    
    // Determinar se o input é numérico (CNPJ/CPF) ou texto (nome)
    const isNumeric = /^[\d.\-\/\s]+$/.test(trimmedQuery);
    
    if (isNumeric) {
      // Input parece ser CNPJ ou CPF - buscar primeiro por documentos
      
      // Buscar por CNPJ
      try {
        const cleanQuery = trimmedQuery.replace(/[.\-\/\s]/g, '');
        if (cleanQuery.length >= 11) { // CNPJ tem 14 dígitos, CPF tem 11
          const supplier = await this.getSupplierByCnpj(cleanQuery);
          if (supplier) {
            results.push({ type: 'supplier', data: supplier });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar fornecedor por CNPJ:', error);
      }
      
      // Buscar por CPF no fornecedor
      try {
        const cleanQuery = trimmedQuery.replace(/[.\-\s]/g, '');
        if (cleanQuery.length >= 10 && cleanQuery.length <= 11) { // CPF pode ter 10 ou 11 dígitos
          const supplier = await this.getSupplierByCpf(cleanQuery);
          if (supplier && !results.find(r => r.type === 'supplier' && r.data.id === supplier.id)) {
            results.push({ type: 'supplier', data: supplier });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar fornecedor por CPF:', error);
      }
      
      // Buscar funcionário por CPF
      try {
        const cleanQuery = trimmedQuery.replace(/[.\-\s]/g, '');
        if (cleanQuery.length >= 3) { // Permitir busca parcial por CPF
          const [employeeRows] = await pool.execute(
            `SELECT fe.*, f.nome_fornecedor 
             FROM funcionarios_fornecedores fe 
             JOIN fornecedores f ON fe.fornecedor_id = f.id 
             WHERE REPLACE(REPLACE(REPLACE(fe.cpf, '.', ''), '-', ''), ' ', '') LIKE ?`,
            [`%${cleanQuery}%`]
          ) as [RowDataPacket[], any];
          
          employeeRows.forEach(employee => {
            results.push({ type: 'employee', data: employee });
          });
        }
      } catch (error) {
        console.error('Erro ao buscar funcionário por CPF:', error);
      }
    } else {
      // Input é texto - buscar por nomes
      
      // Buscar por nome do fornecedor
      try {
        // Primeiro tenta busca exata
        let [supplierRows] = await pool.execute(
          `SELECT * FROM fornecedores WHERE nome_fornecedor LIKE ? OR nome_responsavel LIKE ? LIMIT 10`,
          [`%${trimmedQuery}%`, `%${trimmedQuery}%`]
        ) as [RowDataPacket[], any];
        
        // Se não encontrou nada e tem mais de 3 caracteres, tenta busca mais flexível
        if (supplierRows.length === 0 && trimmedQuery.length > 3) {
          // Busca caractere por caractere (mais tolerante a erros de digitação)
          const flexiblePattern = trimmedQuery.split('').join('%');
          [supplierRows] = await pool.execute(
            `SELECT * FROM fornecedores WHERE nome_fornecedor LIKE ? OR nome_responsavel LIKE ? LIMIT 10`,
            [`%${flexiblePattern}%`, `%${flexiblePattern}%`]
          ) as [RowDataPacket[], any];
        }
        
        supplierRows.forEach(supplier => {
          results.push({ type: 'supplier', data: supplier });
        });
      } catch (error) {
        console.error('Erro ao buscar fornecedor por nome:', error);
      }
      
      // Buscar funcionário por nome
      try {
        const [employeeRows] = await pool.execute(
          `SELECT fe.*, f.nome_fornecedor 
           FROM funcionarios_fornecedores fe 
           JOIN fornecedores f ON fe.fornecedor_id = f.id 
           WHERE fe.nome_funcionario LIKE ? LIMIT 10`,
          [`%${trimmedQuery}%`]
        ) as [RowDataPacket[], any];
        
        employeeRows.forEach(employee => {
          results.push({ type: 'employee', data: employee });
        });
      } catch (error) {
        console.error('Erro ao buscar funcionário por nome:', error);
      }
    }

    return results;
  }

  async getRoutesBySupplier(supplierId: number): Promise<any[]> {
    try {
      const [routeRows] = await pool.execute(
        `SELECT r.*, ri.loja_id, l.nome_loja, l.cidade, l.uf, l.logradouro, l.numero, l.complemento, l.bairro, l.cep, l.regiao, l.telefone_loja, l.nome_operador 
         FROM rotas r 
         LEFT JOIN rota_itens ri ON r.id = ri.rota_id 
         LEFT JOIN lojas l ON ri.loja_id = l.codigo_loja 
         WHERE r.fornecedor_id = ? AND r.status = 'ativa'
         ORDER BY r.id, ri.ordem_visita`,
        [supplierId]
      ) as [RowDataPacket[], any];
      
      // Agrupar rotas com suas lojas
      const routesMap = new Map();
      routeRows.forEach(row => {
        if (!routesMap.has(row.id)) {
          routesMap.set(row.id, {
            id: row.id,
            nome: row.nome,
            status: row.status,
            data_criacao: row.data_criacao,
            data_prevista: row.data_prevista,
            observacoes: row.observacoes,
            lojas: []
          });
        }
        
        if (row.loja_id) {
          routesMap.get(row.id).lojas.push({
            id: row.loja_id,
            nome_loja: row.nome_loja,
            cidade: row.cidade,
            uf: row.uf,
            logradouro: row.logradouro,
            numero: row.numero,
            complemento: row.complemento,
            bairro: row.bairro,
            cep: row.cep,
            regiao: row.regiao,
            telefone_loja: row.telefone_loja,
            nome_operador: row.nome_operador
          });
        }
      });
      
      return Array.from(routesMap.values());
    } catch (error) {
      console.error('Erro ao buscar rotas do fornecedor:', error);
      throw error;
    }
  }

  async getRoutesByEmployee(employeeId: number): Promise<any[]> {
    try {
      // Primeiro buscar o fornecedor_id do funcionário
      const [employeeRows] = await pool.execute(
        `SELECT fornecedor_id FROM funcionarios_fornecedores WHERE id = ?`,
        [employeeId]
      ) as [RowDataPacket[], any];
      
      if (employeeRows.length === 0) {
        return [];
      }
      
      const supplierId = employeeRows[0].fornecedor_id;
      return await this.getRoutesBySupplier(supplierId);
    } catch (error) {
      console.error('Erro ao buscar rotas do funcionário:', error);
      throw error;
    }
  }

  async getStoresByIds(storeIds: string[]): Promise<any[]> {
    try {
      if (storeIds.length === 0) {
        return [];
      }
      
      const placeholders = storeIds.map(() => '?').join(',');
      const [storeRows] = await pool.execute(
        `SELECT * FROM lojas WHERE codigo_loja IN (${placeholders})`,
        storeIds
      ) as [RowDataPacket[], any];
      
      return storeRows;
    } catch (error) {
      console.error('Erro ao buscar lojas por IDs:', error);
      throw error;
    }
  }

  async createRouteItem(item: InsertRouteItem): Promise<RouteItem> {
    const [result] = await pool.execute(
      `INSERT INTO rota_itens (rota_id, loja_id, ordem_visita, status, data_prevista, data_execucao, observacoes, tempo_estimado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.rota_id, 
        item.loja_id, 
        item.ordem_visita, 
        item.status || 'pendente', 
        item.data_prevista || null, 
        item.data_execucao || null, 
        item.observacoes || null, 
        item.tempo_estimado || null
      ]
    ) as [ResultSetHeader, any];
    
    const [rows] = await pool.execute(
      'SELECT * FROM rota_itens WHERE id = ?',
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    return rows[0] as RouteItem;
  }

  async getRouteItems(rotaId: number): Promise<(RouteItem & { loja?: Store })[]> {
    const [rows] = await pool.execute(
      `SELECT ri.*, l.nome_loja, l.logradouro, l.cidade, l.uf 
       FROM rota_itens ri
       LEFT JOIN lojas l ON ri.loja_id = l.codigo_loja
       WHERE ri.rota_id = ?
       ORDER BY ri.ordem_visita ASC`,
      [rotaId]
    ) as [RowDataPacket[], any];
    
    return rows as (RouteItem & { loja?: Store })[];
  }

  async updateRouteItem(id: number, item: Partial<InsertRouteItem>): Promise<RouteItem> {
    const fields = [];
    const values = [];
    
    if (item.ordem_visita) {
      fields.push('ordem_visita = ?');
      values.push(item.ordem_visita);
    }
    if (item.status) {
      fields.push('status = ?');
      values.push(item.status);
    }
    if (item.data_prevista !== undefined) {
      fields.push('data_prevista = ?');
      values.push(item.data_prevista);
    }
    if (item.data_execucao !== undefined) {
      fields.push('data_execucao = ?');
      values.push(item.data_execucao);
    }
    if (item.observacoes !== undefined) {
      fields.push('observacoes = ?');
      values.push(item.observacoes);
    }
    if (item.tempo_estimado !== undefined) {
      fields.push('tempo_estimado = ?');
      values.push(item.tempo_estimado);
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE rota_itens SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    const [rows] = await pool.execute(
      'SELECT * FROM rota_itens WHERE id = ?',
      [id]
    ) as [RowDataPacket[], any];
    
    return rows[0] as RouteItem;
  }

  async deleteRouteItem(id: number): Promise<void> {
    await pool.execute('DELETE FROM rota_itens WHERE id = ?', [id]);
  }

  // Buscar detalhes completos da rota com status das lojas
  async getRouteDetailsWithStatus(routeId: number): Promise<any> {
    // Buscar informações básicas da rota
    const [routeRows] = await pool.execute(
      `SELECT r.*, f.nome_fornecedor 
       FROM rotas r 
       JOIN fornecedores f ON r.fornecedor_id = f.id 
       WHERE r.id = ?`,
      [routeId]
    ) as [RowDataPacket[], any];
    
    if (routeRows.length === 0) {
      return null;
    }
    
    const route = routeRows[0];
    
    // Buscar funcionários da rota
    const [employeeRows] = await pool.execute(
      `SELECT rf.funcionario_id, fe.nome_funcionario
       FROM rota_funcionarios rf
       JOIN funcionarios_fornecedores fe ON rf.funcionario_id = fe.id
       WHERE rf.rota_id = ?`,
      [routeId]
    ) as [RowDataPacket[], any];
    
    const funcionarios = employeeRows.map((emp: any) => emp.nome_funcionario);
    
    // Buscar todos os funcionários/instaladores do fornecedor
    const [instaladoresRows] = await pool.execute(
      `SELECT nome_funcionario 
       FROM funcionarios_fornecedores 
       WHERE fornecedor_id = ?`,
      [route.fornecedor_id]
    ) as [RowDataPacket[], any];
    
    const instaladores = instaladoresRows.map((inst: any) => inst.nome_funcionario);
    
    // Buscar lojas da rota com status
    const [storeRows] = await pool.execute(
      `SELECT 
         l.id,
         l.codigo_loja,
         l.nome_loja,
         l.cidade,
         l.uf,
         l.logradouro,
         l.telefone_loja,
         l.nome_operador,
         ri.ordem_visita,
         -- Verificar se tem instalação finalizada
         CASE 
           WHEN inst.finalizada = 1 THEN true
           ELSE false
         END as instalacao_finalizada,
         -- Verificar se tem chamado aberto
         CASE 
           WHEN ch.id IS NOT NULL THEN true
           ELSE false
         END as tem_chamado_aberto,
         inst.installationDate as data_instalacao,
         ch.id as tem_chamado
       FROM rota_itens ri
       JOIN lojas l ON ri.loja_id = l.codigo_loja
       LEFT JOIN instalacoes inst ON l.codigo_loja = inst.loja_id AND inst.fornecedor_id = ?
       LEFT JOIN chamados ch ON l.codigo_loja = ch.loja_id AND ch.status = 'aberto'
       WHERE ri.rota_id = ?
       ORDER BY ri.ordem_visita`,
      [route.fornecedor_id, routeId]
    ) as [RowDataPacket[], any];
    
    const lojas = storeRows.map((store: any) => ({
      id: store.id,
      codigo_loja: store.codigo_loja,
      nome_loja: store.nome_loja,
      cidade: store.cidade,
      uf: store.uf,
      logradouro: store.logradouro,
      telefone_loja: store.telefone_loja,
      nome_operador: store.nome_operador,
      instalacao_finalizada: store.instalacao_finalizada,
      tem_chamado_aberto: store.tem_chamado_aberto,
      data_instalacao: store.data_instalacao,
      ultimo_chamado: store.ultimo_chamado,
      status: store.tem_chamado_aberto ? 'chamado_aberto' : 
             (store.instalacao_finalizada ? 'finalizada' : 'pendente')
    }));
    
    return {
      id: route.id,
      nome: route.nome,
      status: route.status,
      data_criacao: route.data_criacao,
      data_prevista: route.data_prevista,
      fornecedor_nome: route.nome_fornecedor,
      observacoes: route.observacoes,
      funcionarios,
      instaladores,
      lojas
    };
  }

  async searchSuppliers(query: string): Promise<Supplier[]> {
    const searchQuery = `%${query}%`;
    const cleanQuery = query.replace(/[.\-\/\s]/g, '');
    
    const [rows] = await pool.execute(
      `SELECT * FROM fornecedores 
       WHERE nome_fornecedor LIKE ? 
          OR REPLACE(REPLACE(REPLACE(cnpj, ".", ""), "/", ""), "-", "") LIKE ?
          OR REPLACE(REPLACE(cpf, ".", ""), "-", "") LIKE ?
       ORDER BY nome_fornecedor ASC`,
      [searchQuery, `%${cleanQuery}%`, `%${cleanQuery}%`]
    ) as [RowDataPacket[], any];
    
    return rows as Supplier[];
  }

  async searchStores(query: string): Promise<Store[]> {
    const searchQuery = `%${query}%`;
    
    const [rows] = await pool.execute(
      `SELECT * FROM lojas 
       WHERE codigo_loja LIKE ? 
          OR nome_loja LIKE ?
          OR cidade LIKE ?
          OR uf LIKE ?
       ORDER BY nome_loja ASC
       LIMIT 20`,
      [searchQuery, searchQuery, searchQuery, searchQuery.toUpperCase()]
    ) as [RowDataPacket[], any];
    
    return rows as Store[];
  }

  async filterStores(filters: {
    codigo_loja?: string;
    cidade?: string;
    bairro?: string;
    uf?: string;
    nome_loja?: string;
  }): Promise<Store[]> {
    const conditions = [];
    const values = [];
    
    if (filters.codigo_loja) {
      conditions.push('codigo_loja LIKE ?');
      values.push(`%${filters.codigo_loja}%`);
    }
    if (filters.cidade) {
      conditions.push('cidade LIKE ?');
      values.push(`%${filters.cidade}%`);
    }
    if (filters.bairro) {
      conditions.push('bairro LIKE ?');
      values.push(`%${filters.bairro}%`);
    }
    if (filters.uf) {
      conditions.push('uf LIKE ?');
      values.push(`%${filters.uf.toUpperCase()}%`);
    }
    if (filters.nome_loja) {
      conditions.push('nome_loja LIKE ?');
      values.push(`%${filters.nome_loja}%`);
    }
    
    if (conditions.length === 0) {
      return [];
    }
    
    const [rows] = await pool.execute(
      `SELECT * FROM lojas WHERE ${conditions.join(' AND ')} ORDER BY nome_loja ASC LIMIT 50`,
      values
    ) as [RowDataPacket[], any];
    
    return rows as Store[];
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
    
    // Primeiro tenta busca exata
    let [rows] = await pool.execute(
      'SELECT * FROM fornecedores WHERE REPLACE(REPLACE(REPLACE(cpf, ".", ""), "-", ""), " ", "") = ?',
      [cleanCpf]
    ) as [RowDataPacket[], any];
    
    // Se não encontrou e tem pelo menos 3 dígitos, tenta busca parcial
    if (rows.length === 0 && cleanCpf.length >= 3) {
      [rows] = await pool.execute(
        'SELECT * FROM fornecedores WHERE REPLACE(REPLACE(REPLACE(cpf, ".", ""), "-", ""), " ", "") LIKE ?',
        [`%${cleanCpf}%`]
      ) as [RowDataPacket[], any];
    }
    
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
    
    // Se nenhum filtro foi fornecido, retornar todas as lojas
    const hasFilters = Object.values(filters).some(value => value && value.toString().trim());
    if (!hasFilters) {
      console.log("Nenhum filtro fornecido, retornando todas as lojas");
      const [rows] = await pool.execute('SELECT * FROM lojas LIMIT 50') as [RowDataPacket[], any];
      return rows as Store[];
    }

    // Mapear filtros do frontend para campos do banco
    if (filters.codigo_loja) {
      query += ' AND codigo_loja LIKE ?';
      params.push(`%${filters.codigo_loja}%`);
    }
    if (filters.logradouro) {
      query += ' AND logradouro LIKE ?';
      params.push(`%${filters.logradouro}%`);
    }
    if (filters.bairro) {
      query += ' AND bairro LIKE ?';
      params.push(`%${filters.bairro}%`);
    }
    if (filters.cidade) {
      query += ' AND cidade LIKE ?';
      params.push(`%${filters.cidade}%`);
    }
    if (filters.uf) {
      query += ' AND uf LIKE ?';
      params.push(`%${filters.uf}%`);
    }
    // Manter compatibilidade com filtros antigos
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
    // Retornar o createdAt exatamente como está no banco
    const [installationRows] = await pool.execute(
      `SELECT * FROM instalacoes 
       WHERE loja_id = ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [codigo_loja]
    ) as [RowDataPacket[], any];

    const installation = installationRows[0];
    
    if (!installation) {
      return { isInstalled: false };
    }
    
    // Log para debug do horário
    if (installation && installation.createdAt) {
      console.log(`🕐 Horário direto do banco para loja ${codigo_loja}:`, {
        createdAt: installation.createdAt,
        tipo: typeof installation.createdAt
      });
    }

    // Get supplier info if installation exists
    const [supplierRows] = await pool.execute(
      'SELECT * FROM fornecedores WHERE id = ?',
      [installation.fornecedor_id]
    ) as [RowDataPacket[], any];

    const supplier = supplierRows[0] as Supplier;

    // Buscar fotos finais da tabela fotos_finais em vez do campo JSON
    const [fotosFinaisRows] = await pool.execute(
      'SELECT foto_url FROM fotos_finais WHERE loja_id = ? ORDER BY id ASC',
      [codigo_loja]
    ) as [RowDataPacket[], any];
    
    // Extrair apenas as URLs das fotos finais
    const fotosFinaisFromTable = fotosFinaisRows.map((row: any) => row.foto_url);
    
    // Sobrescrever fotosFinais com dados da tabela fotos_finais
    installation.fotosFinais = fotosFinaisFromTable;
    
    console.log(`🔍 Fotos finais da loja ${codigo_loja}:`, {
      quantidadeEncontrada: fotosFinaisFromTable.length,
      primeiraFoto: fotosFinaisFromTable[0] ? fotosFinaisFromTable[0].substring(0, 50) + '...' : 'Nenhuma'
    });

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
    const query = `
      SELECT 
        c.id,
        c.descricao,
        c.status,
        c.loja_id,
        c.fornecedor_id,
        c.data_abertura,
        c.instalador,
        f.nome_fornecedor,
        f.telefone AS telefone_fornecedor,
        f.estado AS estado_fornecedor,
        f.endereco AS endereco_fornecedor,
        f.nome_responsavel,
        f.email AS email_fornecedor,
        l.codigo_loja,
        l.nome_loja,
        l.nome_operador,
        l.bairro,
        l.cidade,
        l.uf,
        l.telefone_loja,
        l.logradouro,
        l.numero,
        l.complemento,
        l.cep,
        l.regiao,
        CASE 
          WHEN c.instalador = 'Lojista' THEN 'loja'
          ELSE 'fornecedor'
        END as tipo_chamado
      FROM chamados c
      LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
      LEFT JOIN lojas l ON c.loja_id = l.id
      ORDER BY c.data_abertura DESC
    `;
    
    const [rows] = await pool.execute(query) as [RowDataPacket[], any];
    return rows as Ticket[];
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
    // Buscar instalação básica
    const [rows] = await pool.execute(
      'SELECT * FROM instalacoes WHERE loja_id = ? ORDER BY createdAt DESC LIMIT 1',
      [loja_id]
    ) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return null;
    }
    
    const installation = rows[0];
    
    // Buscar fotos específicas da loja da tabela fotos_loja_especificas
    const [fotosLoja] = await pool.execute(
      'SELECT * FROM fotos_loja_especificas WHERE loja_id = ? ORDER BY created_at DESC LIMIT 1',
      [loja_id]
    ) as [RowDataPacket[], any];
    
    // Converter fotos específicas da loja para array compatível
    let fotosOriginais = [];
    if (fotosLoja.length > 0) {
      const fotoData = fotosLoja[0];
      fotosOriginais = [
        fotoData.url_foto_frente_loja || '',
        fotoData.url_foto_interna_loja || '', 
        fotoData.url_foto_interna_lado_direito || '',
        fotoData.url_foto_interna_lado_esquerdo || ''
      ];
      console.log('📸 Fotos originais encontradas na tabela fotos_loja_especificas:', fotosOriginais);
    } else {
      console.log('📸 Nenhuma foto original encontrada na tabela fotos_loja_especificas para loja', loja_id);
    }
    
    // Buscar fotos finais da tabela fotos_finais
    const [fotosFinaisRows] = await pool.execute(
      'SELECT * FROM fotos_finais WHERE loja_id = ? ORDER BY kit_id',
      [loja_id]
    ) as [RowDataPacket[], any];
    
    // Buscar kits para mapear corretamente as fotos finais
    const [kitsRows] = await pool.execute('SELECT * FROM kits ORDER BY id') as [RowDataPacket[], any];
    const kits = kitsRows as Kit[];
    
    // Mapear fotos finais por kit_id
    let fotosFinais = new Array(kits.length).fill('');
    fotosFinaisRows.forEach((foto: any) => {
      if (foto.kit_id) {
        const kitIndex = kits.findIndex(k => k.id === foto.kit_id);
        if (kitIndex >= 0) {
          fotosFinais[kitIndex] = foto.foto_url;
        }
      }
    });
    
    console.log('📸 Fotos finais encontradas na tabela fotos_finais:', fotosFinais);
    
    return {
      ...installation,
      fotosOriginais,
      fotosFinais
    } as Installation;
  }

  async updateInstallation(id: string, installation: InsertInstallation): Promise<Installation> {
    // Atualizar instalação básica (sem as fotos JSON antigas)
    await pool.execute(
      `UPDATE instalacoes SET 
        fornecedor_id = ?,
        responsible = ?, 
        installationDate = ?, 
        justificativaFotos = ?,
        finalizada = ?,
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
        installation.justificativaFotos || null,
        installation.finalizada || false,
        installation.latitude || null,
        installation.longitude || null,
        installation.endereco_geolocalizacao || null,
        installation.mapa_screenshot_url || null,
        installation.geolocalizacao_timestamp ? new Date(installation.geolocalizacao_timestamp) : null,
        id
      ]
    );

    // Salvar fotos originais na tabela fotos_loja_especificas
    if (installation.fotosOriginais && installation.fotosOriginais.length > 0) {
      console.log('💾 Salvando fotos originais na tabela fotos_loja_especificas:', installation.fotosOriginais);
      
      // Deletar fotos anteriores
      await pool.execute('DELETE FROM fotos_loja_especificas WHERE loja_id = ?', [installation.loja_id]);
      
      // Inserir nova linha com as 4 fotos
      await pool.execute(
        `INSERT INTO fotos_loja_especificas 
         (loja_id, url_foto_frente_loja, url_foto_interna_loja, url_foto_interna_lado_direito, url_foto_interna_lado_esquerdo) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          installation.loja_id,
          installation.fotosOriginais[0] || null,
          installation.fotosOriginais[1] || null,
          installation.fotosOriginais[2] || null,
          installation.fotosOriginais[3] || null
        ]
      );
    }

    // Salvar fotos finais na tabela fotos_finais
    if (installation.fotosFinais && installation.fotosFinais.length > 0) {
      console.log('💾 Salvando fotos finais na tabela fotos_finais:', installation.fotosFinais);
      
      // Deletar fotos anteriores
      await pool.execute('DELETE FROM fotos_finais WHERE loja_id = ?', [installation.loja_id]);
      
      // Buscar kits para mapear kit_id
      const [kitsRows] = await pool.execute('SELECT * FROM kits ORDER BY id') as [RowDataPacket[], any];
      const kits = kitsRows as Kit[];
      
      // Inserir cada foto final com seu kit_id correspondente
      for (let i = 0; i < installation.fotosFinais.length; i++) {
        const fotoUrl = installation.fotosFinais[i];
        if (fotoUrl && fotoUrl.trim() !== '' && i < kits.length) {
          await pool.execute(
            'INSERT INTO fotos_finais (loja_id, foto_url, kit_id) VALUES (?, ?, ?)',
            [installation.loja_id, fotoUrl, kits[i].id]
          );
        }
      }
    }

    // Retornar a instalação atualizada usando o método que puxa das tabelas corretas
    return this.getInstallationByStoreId(installation.loja_id) as Promise<Installation>;
  }

  async createInstallation(installation: InsertInstallation): Promise<Installation> {
    const id = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Salvar instalação principal (sem as fotos JSON antigas)
    await pool.execute(
      'INSERT INTO instalacoes (id, loja_id, fornecedor_id, responsible, installationDate, justificativaFotos, finalizada, latitude, longitude, endereco_geolocalizacao, mapa_screenshot_url, geolocalizacao_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, 
        installation.loja_id, 
        installation.fornecedor_id, 
        installation.responsible, 
        installation.installationDate, 
        installation.justificativaFotos || null,
        installation.finalizada || false,
        installation.latitude || null,
        installation.longitude || null,
        installation.endereco_geolocalizacao || null,
        installation.mapa_screenshot_url || null,
        installation.geolocalizacao_timestamp ? new Date(installation.geolocalizacao_timestamp) : null
      ]
    );

    // Salvar fotos originais na tabela fotos_loja_especificas
    if (installation.fotosOriginais && installation.fotosOriginais.length > 0) {
      console.log('💾 Criando fotos originais na tabela fotos_loja_especificas:', installation.fotosOriginais);
      
      await pool.execute(
        `INSERT INTO fotos_loja_especificas 
         (loja_id, url_foto_frente_loja, url_foto_interna_loja, url_foto_interna_lado_direito, url_foto_interna_lado_esquerdo) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          installation.loja_id,
          installation.fotosOriginais[0] || null,
          installation.fotosOriginais[1] || null,
          installation.fotosOriginais[2] || null,
          installation.fotosOriginais[3] || null
        ]
      );
    }

    // Salvar fotos finais na tabela fotos_finais
    if (installation.fotosFinais && installation.fotosFinais.length > 0) {
      console.log('💾 Criando fotos finais na tabela fotos_finais:', installation.fotosFinais);
      
      // Buscar kits para mapear kit_id
      const [kitsRows] = await pool.execute('SELECT * FROM kits ORDER BY id') as [RowDataPacket[], any];
      const kits = kitsRows as Kit[];
      
      // Inserir cada foto final com seu kit_id correspondente
      for (let i = 0; i < installation.fotosFinais.length; i++) {
        const fotoUrl = installation.fotosFinais[i];
        if (fotoUrl && fotoUrl.trim() !== '' && i < kits.length) {
          await pool.execute(
            'INSERT INTO fotos_finais (loja_id, foto_url, kit_id) VALUES (?, ?, ?)',
            [installation.loja_id, fotoUrl, kits[i].id]
          );
        }
      }
    }

    // Retornar a instalação criada usando o método que puxa das tabelas corretas
    return this.getInstallationByStoreId(installation.loja_id) as Promise<Installation>;
  }

  async getStoreLocations(): Promise<{ estados: string[]; cidades: string[]; bairros: string[] }> {
    try {
      // Buscar estados únicos
      const [estados] = await pool.execute(
        'SELECT DISTINCT uf FROM lojas WHERE uf IS NOT NULL AND uf != "" ORDER BY uf'
      ) as [RowDataPacket[], any];
      
      // Buscar cidades únicas
      const [cidades] = await pool.execute(
        'SELECT DISTINCT cidade FROM lojas WHERE cidade IS NOT NULL AND cidade != "" ORDER BY cidade'
      ) as [RowDataPacket[], any];
      
      // Buscar bairros únicos
      const [bairros] = await pool.execute(
        'SELECT DISTINCT bairro FROM lojas WHERE bairro IS NOT NULL AND bairro != "" ORDER BY bairro'
      ) as [RowDataPacket[], any];
      
      return {
        estados: estados.map((e: any) => e.uf),
        cidades: cidades.map((c: any) => c.cidade),
        bairros: bairros.map((b: any) => b.bairro)
      };
    } catch (error) {
      console.error('Erro ao buscar localizações:', error);
      return { estados: [], cidades: [], bairros: [] };
    }
  }

  async getCitiesByState(estado: string): Promise<string[]> {
    try {
      const [cidades] = await pool.execute(
        'SELECT DISTINCT cidade FROM lojas WHERE uf = ? AND cidade IS NOT NULL AND cidade != "" ORDER BY cidade',
        [estado]
      ) as [RowDataPacket[], any];
      
      return cidades.map((c: any) => c.cidade);
    } catch (error) {
      console.error('Erro ao buscar cidades por estado:', error);
      return [];
    }
  }

  async getNeighborhoodsByCity(estado: string, cidade: string): Promise<string[]> {
    try {
      const [bairros] = await pool.execute(
        'SELECT DISTINCT bairro FROM lojas WHERE uf = ? AND cidade = ? AND bairro IS NOT NULL AND bairro != "" ORDER BY bairro',
        [estado, cidade]
      ) as [RowDataPacket[], any];
      
      return bairros.map((b: any) => b.bairro);
    } catch (error) {
      console.error('Erro ao buscar bairros por cidade:', error);
      return [];
    }
  }

  async getDashboardMetrics(filters?: { estado?: string; cidade?: string; bairro?: string }): Promise<{
    totalSuppliers: number;
    totalStores: number;
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    completedInstallations: number;
    nonCompletedStores: number;
    unusedKits: number;
    monthlyInstallations: number[];
    ticketsByStatus: { open: number; resolved: number };
    unusedKitsList: any[];
  }> {
    // Total de fornecedores
    const [supplierRows] = await pool.execute('SELECT COUNT(*) as count FROM fornecedores') as [RowDataPacket[], any];
    
    // Total de lojas com filtros
    let storeQuery = 'SELECT COUNT(*) as count FROM lojas WHERE 1=1';
    const storeParams: any[] = [];
    
    if (filters?.estado) {
      storeQuery += ' AND uf = ?';
      storeParams.push(filters.estado);
    }
    if (filters?.cidade) {
      storeQuery += ' AND cidade = ?';
      storeParams.push(filters.cidade);
    }
    if (filters?.bairro) {
      storeQuery += ' AND bairro = ?';
      storeParams.push(filters.bairro);
    }
    
    const [storeRows] = await pool.execute(storeQuery, storeParams) as [RowDataPacket[], any];
    
    // Total de chamados
    const [ticketRows] = await pool.execute('SELECT COUNT(*) as count FROM chamados') as [RowDataPacket[], any];
    
    // Chamados em aberto com filtros de loja
    let openTicketsQuery = 'SELECT COUNT(*) as count FROM chamados c WHERE LOWER(c.status) = "aberto"';
    const openTicketsParams: any[] = [];
    
    if (filters?.estado || filters?.cidade || filters?.bairro) {
      openTicketsQuery = `
        SELECT COUNT(*) as count 
        FROM chamados c
        INNER JOIN lojas l ON c.loja_id = l.codigo_loja
        WHERE LOWER(c.status) = "aberto"
      `;
      
      if (filters?.estado) {
        openTicketsQuery += ' AND l.uf = ?';
        openTicketsParams.push(filters.estado);
      }
      if (filters?.cidade) {
        openTicketsQuery += ' AND l.cidade = ?';
        openTicketsParams.push(filters.cidade);
      }
      if (filters?.bairro) {
        openTicketsQuery += ' AND l.bairro = ?';
        openTicketsParams.push(filters.bairro);
      }
    }
    
    const [openTicketsRows] = await pool.execute(openTicketsQuery, openTicketsParams) as [RowDataPacket[], any];
    
    // Chamados resolvidos com filtros de loja
    let resolvedTicketsQuery = 'SELECT COUNT(*) as count FROM chamados c WHERE LOWER(c.status) = "resolvido"';
    const resolvedTicketsParams: any[] = [];
    
    if (filters?.estado || filters?.cidade || filters?.bairro) {
      resolvedTicketsQuery = `
        SELECT COUNT(*) as count 
        FROM chamados c
        INNER JOIN lojas l ON c.loja_id = l.codigo_loja
        WHERE LOWER(c.status) = "resolvido"
      `;
      
      if (filters?.estado) {
        resolvedTicketsQuery += ' AND l.uf = ?';
        resolvedTicketsParams.push(filters.estado);
      }
      if (filters?.cidade) {
        resolvedTicketsQuery += ' AND l.cidade = ?';
        resolvedTicketsParams.push(filters.cidade);
      }
      if (filters?.bairro) {
        resolvedTicketsQuery += ' AND l.bairro = ?';
        resolvedTicketsParams.push(filters.bairro);
      }
    }
    
    const [resolvedTicketsRows] = await pool.execute(resolvedTicketsQuery, resolvedTicketsParams) as [RowDataPacket[], any];

    // Lojas finalizadas com filtros
    let completedQuery = `
      SELECT COUNT(DISTINCT i.loja_id) as count 
      FROM instalacoes i
      INNER JOIN lojas l ON i.loja_id = l.id
      WHERE i.finalizada = 1
    `;
    const completedParams: any[] = [];
    
    if (filters?.estado) {
      completedQuery += ' AND l.uf = ?';
      completedParams.push(filters.estado);
    }
    if (filters?.cidade) {
      completedQuery += ' AND l.cidade = ?';
      completedParams.push(filters.cidade);
    }
    if (filters?.bairro) {
      completedQuery += ' AND l.bairro = ?';
      completedParams.push(filters.bairro);
    }
    
    const [completedInstallationsRows] = await pool.execute(completedQuery, completedParams) as [RowDataPacket[], any];

    // Calcula lojas não finalizadas
    const totalStores = storeRows[0].count;
    const completedStores = completedInstallationsRows[0].count;
    const nonCompletedStores = totalStores - completedStores;

    // Kits não usados - contagem total de kits (como exemplo)
    const [unusedKitsRows] = await pool.execute('SELECT COUNT(*) as count FROM kits') as [RowDataPacket[], any];
    
    // Lista de kits para subcategoria
    const [unusedKitsListRows] = await pool.execute('SELECT * FROM kits LIMIT 10') as [RowDataPacket[], any];

    return {
      totalSuppliers: supplierRows[0].count,
      totalStores: totalStores,
      totalTickets: ticketRows[0].count,
      openTickets: openTicketsRows[0].count,
      resolvedTickets: resolvedTicketsRows[0].count,
      completedInstallations: completedStores,
      nonCompletedStores: nonCompletedStores,
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

  // ============ MÉTODOS PARA ASSOCIAÇÕES DE ROTA ============
  
  async createRouteStoreAssociation(routeId: number, storeIds: string[]): Promise<void> {
    // Primeiro, remover associações existentes
    await pool.execute('DELETE FROM rota_itens WHERE rota_id = ?', [routeId]);
    
    // Criar novas associações
    for (let i = 0; i < storeIds.length; i++) {
      await this.createRouteItem({
        rota_id: routeId,
        loja_id: storeIds[i],
        ordem_visita: i + 1
      });
    }
  }

  async createRouteEmployeeAssociation(routeId: number, employeeIds: number[]): Promise<void> {
    // Primeiro, remover associações existentes
    await pool.execute('DELETE FROM rota_funcionarios WHERE rota_id = ?', [routeId]);
    
    // Criar novas associações
    for (const employeeId of employeeIds) {
      await pool.execute(
        'INSERT INTO rota_funcionarios (rota_id, funcionario_id) VALUES (?, ?)',
        [routeId, employeeId]
      );
    }
  }

  // Buscar observações da rota associada à loja
  async getRouteObservationsByStore(storeCode: string): Promise<string | null> {
    try {
      // Primeiro busca a rota que contém essa loja
      const [routeRows] = await pool.execute(
        `SELECT r.observacoes 
         FROM rotas r 
         INNER JOIN rota_itens ri ON r.id = ri.rota_id 
         WHERE ri.loja_id = ? 
         ORDER BY r.data_criacao DESC 
         LIMIT 1`,
        [storeCode]
      ) as [RowDataPacket[], any];

      if (routeRows.length > 0) {
        return routeRows[0].observacoes || null;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar observações da rota por loja:', error);
      throw error;
    }
  }

  // Criar chamado
  async createTicket(ticketData: {
    loja_id: string;
    descricao: string;
    instalador: string;
    data_ocorrencia: string;
    fornecedor_id: number;
    status: string;
  }): Promise<any> {
    try {
      const [result] = await pool.execute(
        `INSERT INTO chamados (loja_id, descricao, instalador, data_ocorrencia, fornecedor_id, status, data_abertura)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          ticketData.loja_id,
          ticketData.descricao,
          ticketData.instalador,
          ticketData.data_ocorrencia,
          ticketData.fornecedor_id,
          ticketData.status
        ]
      ) as [ResultSetHeader, any];

      // Buscar o chamado criado para retornar
      const [ticketRows] = await pool.execute(
        'SELECT * FROM chamados WHERE id = ?',
        [result.insertId]
      ) as [RowDataPacket[], any];

      return ticketRows[0];
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      throw error;
    }
  }

  // Verificar se loja tem chamados em aberto
  async hasOpenTickets(lojaId: string): Promise<boolean> {
    try {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) as count FROM chamados WHERE loja_id = ? AND status = 'aberto'`,
        [lojaId]
      ) as [RowDataPacket[], any];

      return rows[0].count > 0;
    } catch (error) {
      console.error('Erro ao verificar chamados em aberto:', error);
      throw error;
    }
  }

  async createTestDataForRoutes(): Promise<void> {
    try {
      console.log('📝 Criando dados de teste para rotas...');
      
      // Criar associações da rota 1 com algumas lojas
      const testStoreIds = ['50117', '50118', '50119'];
      await this.createRouteStoreAssociation(1, testStoreIds);
      
      // Criar associação com funcionário
      await this.createRouteEmployeeAssociation(1, [1]);
      
      // Criar algumas instalações de teste
      try {
        await pool.execute(
          `INSERT IGNORE INTO instalacoes 
           (loja_id, fornecedor_id, responsible, installationDate, finalizada, createdAt)
           VALUES 
           ('50117', 6, 'Joao da sulva', '2025-08-29', 1, NOW()),
           ('50118', 6, 'Joao da sulva', '2025-08-28', 0, NOW())`,
          []
        );
      } catch (error) {
        console.log('Instalações já existem ou erro:', error);
      }
      
      // Criar alguns chamados de teste
      try {
        await pool.execute(
          `INSERT IGNORE INTO chamados 
           (loja_id, descricao, status)
           VALUES 
           ('50119', 'Problema na instalação - equipamento com defeito', 'aberto')`,
          []
        );
      } catch (error) {
        console.log('Chamados já existem ou erro:', error);
      }
      
      console.log('✅ Dados de teste para rotas criados com sucesso!');
    } catch (error) {
      console.log('⚠️ Erro ao criar dados de teste para rotas:', error);
    }
  }
}

export const storage = new MySQLStorage();