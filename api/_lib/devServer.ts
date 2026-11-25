// Servidor solo para desarrollo local: sirve el mismo handler que la Vercel Function.
import { createServer } from 'node:http';
import handler from '../submissions';

const PORT = Number(process.env.API_PORT ?? 3001);

createServer(async (req, res) => {
  if (!req.url?.startsWith('/api/submissions')) {
    res.statusCode = 404;
    res.end();
    return;
  }
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    body = undefined;
  }
  await handler(Object.assign(req, { body }), res);
}).listen(PORT, () => console.log(`API de desarrollo en http://localhost:${PORT}`));
