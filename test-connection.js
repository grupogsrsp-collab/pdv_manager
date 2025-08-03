import mysql from 'mysql2/promise';

async function testConnection() {
  console.log('🔄 Testando conexão com MySQL da Hostinger...');
  
  const config = {
    host: '162.241.203.65',
    port: 3306,
    user: 'rodr1657_pdv_manager',
    password: 'Pdv429610!',
    database: 'rodr1657_pdv_manager',
    connectTimeout: 30000,
    timeout: 30000,
    ssl: false
  };

  try {
    console.log('🌐 Tentando conectar ao host:', config.host);
    console.log('👤 Usuário:', config.user);
    console.log('🗄️  Banco:', config.database);
    
    const connection = await mysql.createConnection(config);
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query de teste executada:', rows);
    
    await connection.end();
    console.log('✅ Conexão fechada corretamente');
    
  } catch (error) {
    console.log('❌ Erro na conexão:');
    console.log('Código:', error.code);
    console.log('Mensagem:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\n📋 Possíveis causas do timeout:');
      console.log('1. Host/endereço incorreto');
      console.log('2. Porta bloqueada (firewall)');
      console.log('3. MySQL não configurado para conexões externas');
      console.log('4. Credenciais incorretas');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n📋 Conexão recusada:');
      console.log('1. Serviço MySQL não está rodando');
      console.log('2. Porta incorreta');
      console.log('3. Host incorreto');
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n📋 Acesso negado:');
      console.log('1. Usuário ou senha incorretos');
      console.log('2. Usuário não tem permissão para conectar remotamente');
      console.log('3. Banco de dados não existe');
    }
  }
}

testConnection();