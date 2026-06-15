import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  listenAISkills, 
  addAISkill,
  updateAISkill,
  deleteAISkill,
  incrementAISkillCopyCount
} from '../services/firestore';
import BentoCard from '../components/BentoCard';
import { 
  Cpu, 
  Plus, 
  Copy, 
  Check, 
  User, 
  Calendar,
  Sparkles,
  Info,
  Code,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const Skills = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [skills, setSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  // Estados de Criação de Skill
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [argsRaw, setArgsRaw] = useState('');
  const [skillType, setSkillType] = useState('Outro');
  const [skillStatus, setSkillStatus] = useState('Ativo');
  const [skillImpact, setSkillImpact] = useState('Médio');
  const [skillBusinessGoal, setSkillBusinessGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Estados de Edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editSkillName, setEditSkillName] = useState('');
  const [editSkillDesc, setEditSkillDesc] = useState('');
  const [editPromptTemplate, setEditPromptTemplate] = useState('');
  const [editArgsRaw, setEditArgsRaw] = useState('');
  const [editSkillType, setEditSkillType] = useState('Outro');
  const [editSkillStatus, setEditSkillStatus] = useState('Ativo');
  const [editSkillImpact, setEditSkillImpact] = useState('Médio');
  const [editSkillBusinessGoal, setEditSkillBusinessGoal] = useState('');

  // Estados de Exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingSkill, setDeletingSkill] = useState(null);

  // Escutar Skills do Firestore (isolado por time)
  useEffect(() => {
    if (!user?.teamId) return;
    const unsub = listenAISkills(user.teamId, setSkills);
    return () => unsub();
  }, [user?.teamId]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    incrementAISkillCopyCount(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportSkillsToMarkdown = () => {
    if (skills.length === 0) {
      addToast('Nenhuma AI Skill cadastrada.', 'error');
      return;
    }
    let md = `# Catálogo de AI Skills\n\n`;
    skills.forEach(s => {
      const argsText = s.arguments ? s.arguments.map(a => `\`${a.name}\``).join(', ') : 'Nenhum';
      md += `### ${s.name}\n- **Descrição**: ${s.description}\n- **Parâmetros**: ${argsText}\n- **Template**:\n\`\`\`text\n${s.promptTemplate}\n\`\`\`\n\n---\n\n`;
    });
    navigator.clipboard.writeText(md);
    addToast('Catálogo em Markdown copiado!', 'success');
  };

  const exportSkillsToCSV = () => {
    if (skills.length === 0) {
      addToast('Nenhuma AI Skill cadastrada.', 'error');
      return;
    }
    const headers = ['Nome', 'Descricao', 'Prompt Template', 'Argumentos', 'Autor'];
    const csvRows = skills.map(s => {
      const argsText = s.arguments ? s.arguments.map(a => a.name).join(', ') : '';
      return [
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.description.replace(/"/g, '""')}"`,
        `"${s.promptTemplate.replace(/"/g, '""')}"`,
        `"${argsText.replace(/"/g, '""')}"`,
        `"${s.author.replace(/"/g, '""')}"`
      ];
    });
    
    const csvContent = "\ufeff" + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "catalogo_ai_skills.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV de AI Skills baixado!', 'success');
  };
  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!skillName || !skillDesc || !promptTemplate) return;
    setIsSaving(true);

    try {
      const argsArray = argsRaw
        ? argsRaw.split(',').map(arg => ({ name: arg.trim(), description: `Parâmetro de entrada ${arg.trim()}` })).filter(a => a.name.length > 0)
        : [];

      await addAISkill({
        name: skillName,
        description: skillDesc,
        promptTemplate: promptTemplate,
        arguments: argsArray,
        type: skillType,
        status: skillStatus,
        impact: skillImpact,
        businessGoal: skillBusinessGoal
      }, user);

      addToast('AI Skill criada com sucesso!', 'success');
      setSkillName('');
      setSkillDesc('');
      setPromptTemplate('');
      setArgsRaw('');
      setSkillType('Outro');
      setSkillStatus('Ativo');
      setSkillImpact('Médio');
      setSkillBusinessGoal('');
      setCreatorModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Erro ao criar AI Skill.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = (skill) => {
    setEditingSkillId(skill.id);
    setEditSkillName(skill.name || '');
    setEditSkillDesc(skill.description || '');
    setEditPromptTemplate(skill.promptTemplate || '');
    setEditArgsRaw(skill.arguments ? skill.arguments.map(a => a.name).join(', ') : '');
    setEditSkillType(skill.type || 'Outro');
    setEditSkillStatus(skill.status || 'Ativo');
    setEditSkillImpact(skill.impact || 'Médio');
    setEditSkillBusinessGoal(skill.businessGoal || '');
    setEditModalOpen(true);
  };

  const handleEditSkill = async (e) => {
    e.preventDefault();
    if (!editSkillName || !editSkillDesc || !editPromptTemplate || !editingSkillId) return;
    setIsSaving(true);

    try {
      const argsArray = editArgsRaw
        ? editArgsRaw.split(',').map(arg => ({ name: arg.trim(), description: `Parâmetro de entrada ${arg.trim()}` })).filter(a => a.name.length > 0)
        : [];

      await updateAISkill(editingSkillId, {
        name: editSkillName,
        description: editSkillDesc,
        promptTemplate: editPromptTemplate,
        arguments: argsArray,
        type: editSkillType,
        status: editSkillStatus,
        impact: editSkillImpact,
        businessGoal: editSkillBusinessGoal
      }, user);

      addToast('AI Skill atualizada!', 'success');
      setEditModalOpen(false);
      setEditingSkillId(null);
    } catch (err) {
      console.error(err);
      addToast('Erro ao atualizar AI Skill.', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  const handleOpenDeleteConfirm = (skill) => {
    setDeletingSkill(skill);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteSkill = async () => {
    if (!deletingSkill) return;
    setIsSaving(true);
    try {
      await deleteAISkill(deletingSkill.id, user, deletingSkill.name);
      addToast('AI Skill excluída!', 'success');
      setDeleteConfirmOpen(false);
      setDeletingSkill(null);
    } catch (err) {
      console.error(err);
      addToast('Erro ao excluir AI Skill.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER E AÇÕES */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">AI Skills & Prompts</h1>
          <p className="text-sm text-slate-400">Diretrizes, Prompts e Gems homologados pela equipe para uso no Copilot/Cursor/ChatGPT.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto w-full md:w-auto">
          <button
            onClick={exportSkillsToMarkdown}
            className="btn-secondary py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto"
            title="Copiar lista de Prompts como Markdown"
          >
            <span>Copiar Markdown</span>
          </button>
          <button
            onClick={exportSkillsToCSV}
            className="btn-secondary py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto"
            title="Baixar arquivo CSV"
          >
            <span>Baixar CSV</span>
          </button>
          <button
            onClick={() => setCreatorModalOpen(true)}
            className="btn-primary py-2 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova AI Skill</span>
          </button>
        </div>
      </div>

      {/* LISTAGEM DE SKILLS EM BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skills.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6">
            <Cpu className="h-12 w-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium text-sm">Nenhuma AI Skill homologada no time Mississauga. Crie a primeira!</p>
          </div>
        ) : (
          skills.map((skill) => (
            <BentoCard key={skill.id} title={skill.name} subtitle="Skill Homologada" icon={Cpu}>
              <div className="flex flex-col justify-between h-full space-y-4 pt-2">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {skill.type || 'Outro'}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    skill.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    skill.status === 'Experimental' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {skill.status || 'Ativo'}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Impacto: {skill.impact || 'Médio'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 ml-auto flex items-center gap-1 bg-slate-950/40 px-2 py-0.5 rounded border border-slate-800/80">
                    <Copy className="h-2.5 w-2.5" />
                    <span>{skill.copyCounter || 0}x</span>
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{skill.description}</p>

                {skill.businessGoal && (
                  <div className="text-[10px] text-indigo-400 bg-indigo-950/20 border border-indigo-900/30 px-2.5 py-1.5 rounded-xl font-medium">
                    🎯 <strong>Meta de Negócio:</strong> {skill.businessGoal}
                  </div>
                )}

                {/* Previsualização do Código do Prompt */}
                <div className="relative group/code">
                  <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(skill.promptTemplate, skill.id)}
                      className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white"
                    >
                      {copiedId === skill.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono p-4 bg-slate-950/60 border border-slate-900 rounded-xl overflow-x-auto text-slate-400 max-h-[140px]">
                    <code>{skill.promptTemplate}</code>
                  </pre>
                </div>

                {/* Argumentos/Parâmetros */}
                {skill.arguments && skill.arguments.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Code className="h-3 w-3" />
                      <span>Parâmetros de Uso</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {skill.arguments.map((arg, i) => (
                        <span key={i} className="text-[10px] bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 px-2 py-0.5 rounded">
                          {arg.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Autor e data */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-800/80 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>Por {skill.author}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(skill.updatedAt?.seconds * 1000 || skill.updatedAt).toLocaleDateString()}</span>
                    </span>
                    {(!skill.authorUid || skill.authorUid === user?.uid) && (
                      <div className="flex items-center gap-1.5 border-l border-slate-800/80 pl-3">
                        <button
                          onClick={() => handleOpenEditModal(skill)}
                          className="hover:text-indigo-400 transition-colors"
                          title="Editar AI Skill"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteConfirm(skill)}
                          className="hover:text-rose-400 transition-colors"
                          title="Excluir AI Skill"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </BentoCard>
          ))
        )}
      </div>

      {/* MODAL DE CRIAÇÃO */}
      <AnimatePresence>
        {creatorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setCreatorModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl relative z-10 custom-scrollbar"
            >
              <h3 className="text-xl font-bold text-white mb-2">Criar Nova AI Skill / Prompt</h3>
              <p className="text-xs text-slate-400 mb-6">Mapeie prompts específicos de tarefas para compartilhar com a equipe no MCP.</p>

              <form onSubmit={handleCreateSkill} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nome da Skill (ex: Revisão de APIs)</label>
                  <input
                    type="text"
                    required
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    placeholder="Ex: Refatorar API Winthor"
                    className="premium-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Descrição de Uso</label>
                  <input
                    type="text"
                    required
                    value={skillDesc}
                    onChange={(e) => setSkillDesc(e.target.value)}
                    placeholder="Ex: Prompt para revisar boas práticas e performance de rotas"
                    className="premium-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Template do Prompt (Corpo principal)</label>
                  <textarea
                    required
                    rows={5}
                    value={promptTemplate}
                    onChange={(e) => setPromptTemplate(e.target.value)}
                    placeholder="Você é um especialista em Winthor... revise o código {{codigo}}..."
                    className="premium-input resize-none font-mono text-xs bg-slate-950/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <span>Argumentos / Variáveis (separados por vírgula)</span>
                    <span className="group relative cursor-pointer text-slate-500 hover:text-white">
                      <Info className="h-3 w-3" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded bg-slate-950 border border-slate-800 text-[9px] text-slate-400 invisible group-hover:visible shadow-xl leading-normal">
                        Defina variáveis que serão preenchidas na IDE, como: codigo, tabela, rota.
                      </span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={argsRaw}
                    onChange={(e) => setArgsRaw(e.target.value)}
                    placeholder="Ex: codigo, tabela"
                    className="premium-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tipo</label>
                    <select
                      value={skillType}
                      onChange={(e) => setSkillType(e.target.value)}
                      className="premium-input bg-slate-950"
                    >
                      <option value="Assistente de Código">Assistente de Código</option>
                      <option value="Gerador de Prompts">Gerador de Prompts</option>
                      <option value="SQL Query">SQL Query</option>
                      <option value="Atendimento">Atendimento</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Status</label>
                    <select
                      value={skillStatus}
                      onChange={(e) => setSkillStatus(e.target.value)}
                      className="premium-input bg-slate-950"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Experimental">Experimental</option>
                      <option value="Arquivado">Arquivado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Impacto</label>
                    <select
                      value={skillImpact}
                      onChange={(e) => setSkillImpact(e.target.value)}
                      className="premium-input bg-slate-950"
                    >
                      <option value="Alto">Alto</option>
                      <option value="Médio">Médio</option>
                      <option value="Baixo">Baixo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Meta de Negócio (Objetivo)</label>
                  <input
                    type="text"
                    value={skillBusinessGoal}
                    onChange={(e) => setSkillBusinessGoal(e.target.value)}
                    placeholder="Ex: Reduzir tempo de setup de banco em 20%"
                    className="premium-input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCreatorModalOpen(false)}
                    className="btn-secondary py-2.5 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary py-2.5 text-xs flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Homologar Skill</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE EDIÇÃO */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setEditModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl relative z-10 custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">Editar AI Skill / Prompt</h3>
                <button 
                  onClick={() => setEditModalOpen(false)} 
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-6">Atualize as diretrizes ou o prompt homologado para a equipe.</p>

              <form onSubmit={handleEditSkill} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nome da Skill (ex: Revisão de APIs)</label>
                  <input
                    type="text"
                    required
                    value={editSkillName}
                    onChange={(e) => setEditSkillName(e.target.value)}
                    placeholder="Ex: Refatorar API Winthor"
                    className="premium-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Descrição de Uso</label>
                  <input
                    type="text"
                    required
                    value={editSkillDesc}
                    onChange={(e) => setEditSkillDesc(e.target.value)}
                    placeholder="Ex: Prompt para revisar boas práticas e performance de rotas"
                    className="premium-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Template do Prompt (Corpo principal)</label>
                  <textarea
                    required
                    rows={5}
                    value={editPromptTemplate}
                    onChange={(e) => setEditPromptTemplate(e.target.value)}
                    placeholder="Você é um especialista em Winthor... revise o código {{codigo}}..."
                    className="premium-input resize-none font-mono text-xs bg-slate-950/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <span>Argumentos / Variáveis (separados por vírgula)</span>
                  </label>
                   <input
                    type="text"
                    value={editArgsRaw}
                    onChange={(e) => setEditArgsRaw(e.target.value)}
                    placeholder="Ex: codigo, tabela"
                    className="premium-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tipo</label>
                    <select
                      value={editSkillType}
                      onChange={(e) => setEditSkillType(e.target.value)}
                      className="premium-input bg-slate-950"
                    >
                      <option value="Assistente de Código">Assistente de Código</option>
                      <option value="Gerador de Prompts">Gerador de Prompts</option>
                      <option value="SQL Query">SQL Query</option>
                      <option value="Atendimento">Atendimento</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Status</label>
                    <select
                      value={editSkillStatus}
                      onChange={(e) => setEditSkillStatus(e.target.value)}
                      className="premium-input bg-slate-950"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Experimental">Experimental</option>
                      <option value="Arquivado">Arquivado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Impacto</label>
                    <select
                      value={editSkillImpact}
                      onChange={(e) => setEditSkillImpact(e.target.value)}
                      className="premium-input bg-slate-950"
                    >
                      <option value="Alto">Alto</option>
                      <option value="Médio">Médio</option>
                      <option value="Baixo">Baixo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Meta de Negócio (Objetivo)</label>
                  <input
                    type="text"
                    value={editSkillBusinessGoal}
                    onChange={(e) => setEditSkillBusinessGoal(e.target.value)}
                    placeholder="Ex: Reduzir tempo de setup de banco em 20%"
                    className="premium-input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="btn-secondary py-2.5 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary py-2.5 text-xs flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Salvar Alterações</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setDeleteConfirmOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-rose-900/30 rounded-2xl p-6 w-full max-w-md shadow-2xl relative z-10"
            >
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                  <Trash2 className="h-5 w-5" />
                </span>
                <span>Excluir AI Skill?</span>
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Tem certeza que deseja excluir a AI Skill <strong className="text-white">"{deletingSkill?.name}"</strong>? Esta ação é irreversível e removerá permanentemente a diretriz de prompts do MCP da equipe.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="btn-secondary py-2 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleDeleteSkill}
                  className="bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>Excluir Definitivamente</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Skills;
