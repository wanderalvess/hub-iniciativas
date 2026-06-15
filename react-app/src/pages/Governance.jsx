import React from 'react';
import BentoCard from '../components/BentoCard';
import { 
  ShieldCheck, Lock, Database, ShieldAlert, CloudOff, KeyRound, Eye, 
  FileCheck, CheckCircle2, AlertTriangle, Users, Sparkles, Globe, 
  Server, Fingerprint, Scale, ExternalLink, HelpCircle 
} from 'lucide-react';

const SECURITY_PILLARS = [
  {
    icon: Lock,
    title: "Autenticação Segura",
    description: "Login exclusivo via Google OAuth 2.0 (Firebase Authentication). Nenhuma senha é armazenada diretamente pelo Hub.",
    details: [
      "Tokens JWT assinados pelo Firebase com expiração automática",
      "Sessões gerenciadas pelo Firebase SDK nativo, sem cookies vulneráveis",
      "Logout global disponível a qualquer momento"
    ],
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
  },
  {
    icon: Database,
    title: "Isolamento por Time",
    description: "Regras de segurança no Firestore garantem que apenas membros autorizados de um squad consigam ler ou alterar seus fluxos.",
    details: [
      "Ambientes, Workflows e Posts filtrados e isolados por teamId",
      "Regras de auditoria registram ações sensíveis de forma imutável",
      "Validação no servidor para impedir manipulações manuais"
    ],
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20"
  },
  {
    icon: ShieldCheck,
    title: "Segurança de Acesso E2EE",
    description: "No Secret Vault, as credenciais e payloads confidenciais são criptografados no cliente via Web Crypto API (AES-GCM 256).",
    details: [
      "A chave secreta trafega apenas na URL (hash de localização #) e não vai para o servidor",
      "Payloards confidenciais expiram automaticamente",
      "O conteúdo de cofre de uso único é deletado assim que lido"
    ],
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
  },
  {
    icon: CloudOff,
    title: "Zero Backend Proprietário",
    description: "Toda a infraestrutura é executada em redes confiáveis de CDN e gerenciada pela nuvem segura do Google Cloud e Firebase.",
    details: [
      "Hospedagem estática moderna escalável",
      "Banco de dados relacional offline-first (Cloud Firestore)",
      "Políticas rígidas contra armazenamento em trânsito não encriptado"
    ],
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
  }
];

const DATA_INVENTORY = [
  { category: "Perfil de Usuário", data: "Nome, e-mail, foto, time ativo e paleta de cores", storage: "Firestore ('users')", access: "O próprio usuário" },
  { category: "Workflows & APIs", data: "Cadeia de rotas, nomes de sistemas, integradores e descrições", storage: "Firestore ('workflows')", access: "Membros do Squad associado" },
  { category: "Ambientes & VMs", data: "Hostname, IP, status de reserva e agendamentos", storage: "Firestore ('environments')", access: "Membros do Squad associado" },
  { category: "Feed de Iniciativas", data: "Posts, curtidas e comentários compartilhados do squad", storage: "Firestore ('feed')", access: "Membros do Squad associado" },
  { category: "Segredos Criptografados", data: "Payload cifrado (AES-GCM), vetor de inicialização (IV)", storage: "Firestore ('vault_secrets')", access: "Somente quem possui o link/hash" },
  { category: "Registros de Auditoria", data: "Nome do autor, ação executada, timestamp e recurso", storage: "Firestore ('audit')", access: "Membros do Squad associado" }
];

const Governance = () => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl shadow-md">
          <ShieldCheck className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Portal de <span className="text-indigo-400">Governança &amp; Segurança</span>
          </h1>
          <p className="text-xs text-slate-400">
            Transparência corporativa: saiba como os dados da operação, fluxos de API e chaves confidenciais são gerenciados e protegidos.
          </p>
        </div>
      </div>

      {/* INFRASTRUCTURE INFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Frontend da Aplicação", value: "Vite + React (SPA)", sub: "Static hosting seguro", icon: Globe, color: "text-indigo-400" },
          { label: "Armazenamento", value: "Cloud Firestore", sub: "Isolamento lógico e regras de escrita", icon: Database, color: "text-amber-400" },
          { label: "Autenticação integrada", value: "Firebase Auth", sub: "Google OAuth 2.0 Identity", icon: Fingerprint, color: "text-emerald-400" }
        ].map((item, i) => (
          <BentoCard key={i}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{item.label}</p>
                <p className="text-sm font-black text-white">{item.value}</p>
                <p className="text-[10px] text-slate-400 font-medium">{item.sub}</p>
              </div>
            </div>
          </BentoCard>
        ))}
      </div>

      {/* SECURITY PILLARS */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Lock className="h-5 w-5 text-indigo-400" />
          <span>Pilares de Segurança</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECURITY_PILLARS.map((pillar, i) => (
            <BentoCard key={i} title={pillar.title} subtitle={pillar.description} icon={pillar.icon}>
              <div className="space-y-2 pt-3">
                {pillar.details.map((detail, j) => (
                  <div key={j} className="flex items-start gap-2 text-slate-300 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </BentoCard>
          ))}
        </div>
      </div>

      {/* DATA INVENTORY */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-indigo-400" />
          <span>Inventário de Dados Coletados</span>
        </h3>
        <BentoCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="pb-3 pr-4">Categoria</th>
                  <th className="pb-3 px-4">Dados Mapeados</th>
                  <th className="pb-3 px-4">Armazenamento</th>
                  <th className="pb-3 pl-4">Acesso Limitado A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {DATA_INVENTORY.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-3 pr-4 font-bold text-white">{row.category}</td>
                    <td className="py-3 px-4">{row.data}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-indigo-300">{row.storage}</td>
                    <td className="py-3 pl-4">{row.access}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>

      {/* LEGAL & TERMS BOX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BentoCard title="Limitações de Responsabilidade" icon={AlertTriangle}>
          <div className="space-y-2.5 text-xs text-slate-400 pt-2 leading-relaxed">
            <p>O Hub de Iniciativas é um ecossistema integrador para produtividade de squads. Não substitui ferramentas de gestão oficial corporativa como Jira ou Confluence.</p>
            <p>A plataforma não assume responsabilidade por dados perdidos em falhas globais dos serviços Google Cloud, embora redundâncias offline via client cache estejam ativas.</p>
          </div>
        </BentoCard>

        <BentoCard title="Conformidade LGPD" icon={Scale}>
          <div className="space-y-2.5 text-xs text-slate-400 pt-2 leading-relaxed">
            <p>Os dados tratados se limitam estritamente aos metadados operacionais e nomes públicos de integração. Nenhuma informação de identificação pessoal sensível ou bancária é armazenada.</p>
            <p>Os usuários podem requerer a deleção total de seu registro do banco a qualquer instante através dos administradores.</p>
          </div>
        </BentoCard>
      </div>
    </div>
  );
};

export default Governance;
