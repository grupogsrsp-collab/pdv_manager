import mysql from 'mysql2/promise';

// Configuração de conexão com MySQL da Hostinger
const dbConfig = {
  host: 'rodrigoxavierdossant1751244133466.0651190.meusitehostgator.com.br',
  port: 3306,
  user: 'pdv_manager',
  password: 'Pdv429610!',
  database: 'rodr1657_pdv_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  ssl: false,
  connectTimeout: 30000,
  socketPath: undefined
};

// Pool de conexões para melhor performance
export const pool = mysql.createPool(dbConfig);

// Função para testar a conexão
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:', error);
    return false;
  }
}

// Função para executar queries
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  }
}

export default pool;