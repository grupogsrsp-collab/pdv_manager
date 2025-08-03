// Script para testar a conexão com MySQL da Hostinger
import mysql from 'mysql2/promise';

// ⚠️ IMPORTANTE: Para conectar ao MySQL da Hostinger, você precisará:
// 1. Verificar se o MySQL está configurado para aceitar conexões externas
// 2. Usar o host correto (não localhost quando conectando externamente)
// 3. Verificar as configurações de firewall da Hostinger

const testDatabaseConnection = async () => {
  console.log('🔄 Testando conexão com MySQL da Hostinger...');
  
  // Configurações para teste local (durante desenvolvimento)
  const localConfig = {
    host: 'localhost',
    port: 3306,
    user: 'pdv_manager',
    password: 'Pdv429610!',
    database: 'rodr1657_pdv_manager',
  };

  // Configurações para Hostinger (produção)
  // Nota: O host deve ser o endereço do servidor MySQL da Hostinger
  // Exemplo: mysql.hostinger.com ou o IP específico fornecido
  const hostingerConfig = {
    host: 'mysql.hostinger.com', // ⚠️ Substitua pelo host correto da Hostinger
    port: 3306,
    user: 'pdv_manager',
    password: 'Pdv429610!',
    database: 'rodr1657_pdv_manager',
    // ssl: false, // Ajuste conforme necessário
  };

  try {
    console.log('📡 Tentando conectar localmente primeiro...');
    const localConnection = await mysql.createConnection(localConfig);
    await localConnection.execute('SELECT 1 as test');
    console.log('✅ Conexão local bem-sucedida!');
    await localConnection.end();
  } catch (localError: any) {
    console.log('❌ Conexão local falhou (esperado se não houver MySQL local)');
    console.log('Erro:', localError.message);
  }

  try {
    console.log('🌐 Tentando conectar à Hostinger...');
    const hostingerConnection = await mysql.createConnection(hostingerConfig);
    await hostingerConnection.execute('SELECT 1 as test');
    console.log('✅ Conexão com Hostinger bem-sucedida!');
    await hostingerConnection.end();
  } catch (hostingerError: any) {
    console.log('❌ Conexão com Hostinger falhou');
    console.log('Erro:', hostingerError.message);
    console.log('\n📝 Passos para resolver:');
    console.log('1. Verificar se o host está correto (não usar localhost para Hostinger)');
    console.log('2. Confirmar credenciais de acesso');
    console.log('3. Verificar se a Hostinger permite conexões externas');
    console.log('4. Configurar whitelist de IPs se necessário');
  }
};

export { testDatabaseConnection };