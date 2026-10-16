import ngrok from '@ngrok/ngrok';

const address = process.env.NGROK_ADDR || 'localhost:8000';
const domain = process.env.NGROK_DOMAIN || 'reviver-resurrect-silver.ngrok-free.dev';

if (!process.env.NGROK_AUTHTOKEN) {
  console.error('Defina NGROK_AUTHTOKEN com seu token do ngrok antes de iniciar o túnel.');
  process.exit(1);
}

let listener;
let closing = false;

async function closeTunnel(signal) {
  if (closing) {
    return;
  }
  closing = true;
  console.log(`\nEncerrando túnel (${signal})...`);

  try {
    await listener?.close();
  } catch (error) {
    console.error('Não foi possível encerrar o túnel do ngrok:', error.message);
    process.exitCode = 1;
  } finally {
    process.stdin.pause();
  }
}

process.once('SIGINT', () => void closeTunnel('SIGINT'));
process.once('SIGTERM', () => void closeTunnel('SIGTERM'));

try {
  listener = await ngrok.forward({
    addr: address,
    authtoken_from_env: true,
    domain,
  });

  console.log(`API local: http://${address}/api`);
  console.log(`API pública: ${listener.url()}/api`);
  console.log('Mantenha este terminal aberto enquanto os apps usam a API.');
  process.stdin.resume();
} catch (error) {
  console.error('Falha ao iniciar o túnel ngrok:', error.message);
  process.exitCode = 1;
}
