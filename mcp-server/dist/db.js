"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
}
else {
    // Tenta inicializar com as credenciais padrão do ambiente Google
    try {
        admin.initializeApp();
    }
    catch (e) {
        console.warn("Firebase Admin SDK não pôde ser inicializado. Cole o arquivo JSON da conta de serviço na raiz do servidor MCP.");
    }
}
exports.db = admin.firestore ? admin.firestore() : null;
