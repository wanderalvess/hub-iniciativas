import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const defaultPath = path.join(process.cwd(), 'serviceAccountKey.json');
let serviceAccountPath = fs.existsSync(defaultPath) ? defaultPath : '';

if (!serviceAccountPath) {
  // Busca por qualquer outro arquivo JSON de conta de serviço na pasta do servidor
  const files = fs.readdirSync(process.cwd());
  const serviceAccountFile = files.find(f => f.endsWith('.json') && (f.includes('adminsdk') || f.includes('firebase-admin')));
  if (serviceAccountFile) {
    serviceAccountPath = path.join(process.cwd(), serviceAccountFile);
  }
}

if (serviceAccountPath) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  // Tenta inicializar com as credenciais padrão do ambiente Google
  try {
    admin.initializeApp();
  } catch (e) {
    console.warn("Firebase Admin SDK não pôde ser inicializado. Cole o arquivo JSON da conta de serviço na raiz do servidor MCP.");
  }
}

export const db = admin.firestore ? admin.firestore() : null;
