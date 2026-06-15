import React from 'react';
import BentoCard from '../components/BentoCard';
import { History, Tag, Rocket, Paintbrush, ShieldAlert, CheckCircle } from 'lucide-react';

const Versions = () => {
  const versionsData = [
    {
      version: '1.1.0',
      date: '15 de Junho de 2026',
      title: 'Modo Claro & Importador Inteligente',
      description: 'Melhorias de legibilidade no Modo Claro, importador inteligente de workflows a partir de markdown e fluxos dinâmicos bidirecionais.',
      features: [
        {
          category: 'Ajustes de Acessibilidade & Modo Claro',
          icon: Paintbrush,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          items: [
            'Correção de textos cinza escuro ilegíveis em fundo claro no explorador de rotas, sugestão de melhorias, cronograma de execução, mapeamento de projetos e fluxos.',
            'Cores dos diagramas Mermaid auto-ajustáveis dinamicamente ao alternar o tema do sistema.',
            'Ajuste nos modais de criação de workflow para exibição correta e rolável em zoom de 100% sem cortes de tela.'
          ]
        },
        {
          category: 'Workflows & Importador Inteligente',
          icon: Rocket,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          items: [
            'Importador inteligente de arquivos markdown (.md) que infere e autopreenche automaticamente as propriedades do workflow (Origem, Destino, Integradores e Cadeia de Sistemas).',
            'Suporte a fluxos bidirecionais e encadeados contínuos (ex: X -> Y -> Z ou X <-> Y <-> Z <-> A) com animações de sinal em tempo real.'
          ]
        },
        {
          category: 'Infraestrutura & Deploy',
          icon: ShieldAlert,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          items: [
            'Inclusão do servidor web sirv-cli no comando de inicialização de produção para garantir que a revisão do Cloud Run suba corretamente.'
          ]
        }
      ]
    },
    {
      version: '1.0.0',
      date: '14 de Junho de 2026',
      title: 'Lançamento Inicial & Módulos Avançados',
      description: 'Primeira versão estável contendo toda a reestruturação e novos módulos de suporte técnico da equipe.',
      features: [
        {
          category: 'Base de Conhecimento (Wiki)',
          icon: Rocket,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          items: [
            'Interface técnica completa estilo GitBook (/knowledge) com pastas/categorias.',
            'Suporte a favoritação local de artigos mais acessados (LocalStorage).',
            'Carga inicial automática integrada a partir do mapeamento local de APIs (api interna.txt).'
          ]
        },
        {
          category: 'Busca Textual Completa (Search)',
          icon: Rocket,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          items: [
            'Filtro de busca em profundidade que faz varredura completa dentro do corpo de texto das documentações.'
          ]
        },
        {
          category: 'Importador Confluence / TDN',
          icon: Rocket,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          items: [
            'Importador por pageId do Confluence/TDN com conversão automática de marcações HTML para texto limpo estruturado.'
          ]
        },
        {
          category: 'Jolt Playground',
          icon: Rocket,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          items: [
            'Engine e simulador JOLT local para testar mapeamentos JSON em tempo real diretamente na aba de Workflows.'
          ]
        },
        {
          category: 'Temas Neon Customizados',
          icon: Paintbrush,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          items: [
            'Seletores de cores de marca (primária e secundária) com presets e paleta livre na tela de Perfil.'
          ]
        },
        {
          category: 'Melhorias de Usabilidade',
          icon: Paintbrush,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          items: [
            'Menu de navegação superior (Top Bar) para liberar espaço de tela em resoluções desktop.',
            'Aumento do espaço de tela principal para max-w-[90rem] (1440px).',
            'Metadados aprimorados e contador de cópias em AI Skills.',
            'Suporte a comentários em postagens do feed social.'
          ]
        },
        {
          category: 'Correções de Segurança & Bugs',
          icon: ShieldAlert,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          items: [
            'Correção do erro de renderização do ícone BookOpen que causava tela em branco.',
            'Mapeamento da coleção de times nas regras de segurança do Firestore para destravar o Onboarding.',
            'Ajuste na regra de validação de usuários para aceitar links de avatar vazios (photoURL).'
          ]
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <History className="h-8 w-8 text-indigo-400" />
          <span>Notas de Versão &amp; Evolução</span>
        </h1>
        <p className="text-sm text-slate-400">
          Acompanhe o histórico de lançamentos, novidades e correções aplicadas no Hub de Iniciativas.
        </p>
      </div>

      {/* TIMELINE */}
      <div className="space-y-12 relative before:absolute before:inset-0 before:left-4 md:before:left-1/2 before:w-[2px] before:bg-slate-900 before:pointer-events-none pb-12">
        {versionsData.map((ver, idx) => (
          <div key={ver.version} className="relative flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6">
            
            {/* Timeline node dot */}
            <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-950 border-4 border-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.6)] z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
            </div>

            {/* Version Badge Side (Left on Desktop) */}
            <div className="w-full md:w-[45%] pl-10 md:pl-0 md:text-right flex flex-col items-start md:items-end">
              <span className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-black px-3 py-1 rounded-full tracking-wider uppercase mb-1">
                <Tag className="h-3 w-3" /> Versão {ver.version}
              </span>
              <span className="text-[10px] font-bold text-slate-500 block">{ver.date}</span>
              <h3 className="text-lg font-bold text-white mt-1 leading-tight">{ver.title}</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-md md:text-right">{ver.description}</p>
            </div>

            {/* Spacer for right/left matching */}
            <div className="hidden md:block w-[10%]"></div>

            {/* Card Content Side (Right on Desktop) */}
            <div className="w-full md:w-[45%] pl-10 md:pl-0">
              <BentoCard title={`Histórico da Versão ${ver.version}`} subtitle="Entregas do Release">
                <div className="space-y-6 pt-2">
                  {ver.features.map((feat, i) => {
                    const CatIcon = feat.icon;
                    return (
                      <div key={i} className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-lg border ${feat.color}`}>
                            <CatIcon className="h-3.5 w-3.5" />
                          </div>
                          <h4 className="text-xs font-bold text-white">{feat.category}</h4>
                        </div>
                        <ul className="space-y-1.5 pl-7 list-disc list-outside text-slate-400 text-xs leading-relaxed">
                          {feat.items.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </BentoCard>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default Versions;
