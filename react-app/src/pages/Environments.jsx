import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  listenEnvironments, 
  reserveEnvironment,
  addEnvironment,
  updateEnvironment,
  deleteEnvironment
} from '../services/firestore';
import BentoCard from '../components/BentoCard';
import { 
  Server, 
  User, 
  Calendar, 
  Activity,
  CheckCircle,
  HelpCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const Environments = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [vms, setVms] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Estados de Criação
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  const [envName, setEnvName] = useState('');
  const [envIp, setEnvIp] = useState('');
  const [envDesc, setEnvDesc] = useState('');
  const [envStatus, setEnvStatus] = useState('disponivel');

  // Estados de Edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEnvId, setEditingEnvId] = useState(null);
  const [editEnvName, setEditEnvName] = useState('');
  const [editEnvIp, setEditEnvIp] = useState('');
  const [editEnvDesc, setEditEnvDesc] = useState('');
  const [editEnvStatus, setEditEnvStatus] = useState('disponivel');

  // Estados de Exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingEnv, setDeletingEnv] = useState(null);

  // Escutar ambientes (isolado por time)
  useEffect(() => {
    if (!user?.teamId) return;
    const unsub = listenEnvironments(user.teamId, setVms);
    return () => unsub();
  }, [user?.teamId]);

  const exportVMsToCSV = () => {
    if (vms.length === 0) {
      addToast('Nenhuma VM cadastrada.', 'error');
      return;
    }
    const headers = ['Nome', 'IP', 'Descricao', 'Status', 'Usuario Atual', 'Ultima Atualizacao'];
    const csvRows = vms.map(vm => {
      const lastUp = vm.lastUpdated?.seconds 
        ? new Date(vm.lastUpdated.seconds * 1000).toLocaleString('pt-BR') 
        : new Date(vm.lastUpdated).toLocaleString('pt-BR');
      return [
        `"${vm.name.replace(/"/g, '""')}"`,
        `"${(vm.ip || '').replace(/"/g, '""')}"`,
        `"${(vm.description || '').replace(/"/g, '""')}"`,
        `"${vm.status}"`,
        `"${(vm.currentUser || '').replace(/"/g, '""')}"`,
        `"${lastUp}"`
      ];
    });
    
    const csvContent = "\ufeff" + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "lista_ambientes_vms.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV de ambientes baixado!', 'success');
  };

  const handleReserve = async (vmId, vmName, currentStatus) => {
    try {
      await reserveEnvironment(vmId, vmName, user, currentStatus);
    } catch (err) {
      console.error('Erro ao gerenciar VM:', err);
    }
  };

  const handleCreateEnvironment = async (e) => {
    e.preventDefault();
    if (!envName) return;
    setIsSaving(true);

    try {
      await addEnvironment({
        name: envName,
        ip: envIp,
        description: envDesc,
        status: envStatus
      }, user);

      // Resetar form
      setEnvName('');
      setEnvIp('');
      setEnvDesc('');
      setEnvStatus('disponivel');
      setCreatorModalOpen(false);
    } catch (err) {
      console.error('Erro ao criar ambiente:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = (vm) => {
    setEditingEnvId(vm.id);
    setEditEnvName(vm.name || '');
    setEditEnvIp(vm.ip || '');
    setEditEnvDesc(vm.description || '');
    setEditEnvStatus(vm.status || 'disponivel');
    setEditModalOpen(true);
  };

  const handleEditEnvironment = async (e) => {
    e.preventDefault();
    if (!editEnvName || !editingEnvId) return;
    setIsSaving(true);

    try {
      await updateEnvironment(editingEnvId, {
        name: editEnvName,
        ip: editEnvIp,
        description: editEnvDesc,
        status: editEnvStatus
      }, user);

      setEditModalOpen(false);
      setEditingEnvId(null);
    } catch (err) {
      console.error('Erro ao editar ambiente:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDeleteConfirm = (vm) => {
    setDeletingEnv(vm);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteEnvironment = async () => {
    if (!deletingEnv) return;
    setIsSaving(true);
    try {
      await deleteEnvironment(deletingEnv.id, user, deletingEnv.name);
      setDeleteConfirmOpen(false);
      setDeletingEnv(null);
    } catch (err) {
      console.error('Erro ao excluir ambiente:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'disponivel':
        return <span className="badge-emerald">Disponível</span>;
      case 'em_uso':
        return <span className="badge-amber">Em Uso</span>;
      case 'manutencao':
        return <span className="badge-rose">Manutenção</span>;
      default:
        return <span className="badge-rose">Desconhecido</span>;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'disponivel': return 'Disponível para check-in e testes.';
      case 'em_uso': return 'Ocupada no momento para validações.';
      case 'manutencao': return 'Em manutenção preventiva pela TI.';
      default: return 'Status não catalogado.';
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    if (dateVal.seconds) {
      return new Date(dateVal.seconds * 1000).toLocaleString('pt-BR');
    }
    const date = new Date(dateVal);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Ambientes &amp; VMs</h1>
          <p className="text-sm text-slate-400">Controle e reserva em tempo real dos servidores dedicados do time de V&amp;D.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <button
            onClick={exportVMsToCSV}
            className="btn-secondary py-2.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto"
            title="Baixar lista de VMs em CSV"
          >
            <span>Baixar CSV</span>
          </button>
          <button
            onClick={() => setCreatorModalOpen(true)}
            className="btn-primary py-2.5 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Ambiente</span>
          </button>
        </div>
      </div>

      {/* GRADE DE VMS E INSTRUÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LISTAGEM DE VMS (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {vms.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6">
              <Server className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-medium text-sm">Nenhum servidor ou VM configurada.</p>
            </div>
          ) : (
            vms.map((vm) => (
              <div 
                key={vm.id} 
                className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700/60 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base tracking-tight">{vm.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{vm.ip || 'Sem IP associado'}</p>
                    </div>
                    <div className="ml-2">
                      {getStatusBadge(vm.status)}
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">{vm.description}</p>

                  {/* Informações da Reserva */}
                  {vm.status === 'em_uso' && (
                    <div className="flex flex-wrap gap-4 pt-2 text-[10px] text-slate-500 border-t border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Ocupado por: <strong className="text-slate-300">{vm.currentUser}</strong></span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Desde: <strong className="text-slate-300">{formatDate(vm.lastUpdated)}</strong></span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-auto">
                  <button
                    onClick={() => handleOpenEditModal(vm)}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-900 hover:border-slate-700/60 rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center"
                    title="Editar Ambiente"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteConfirm(vm)}
                    className="p-2.5 bg-slate-950 hover:bg-rose-950/40 border border-slate-900 hover:border-rose-900/50 rounded-xl text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center"
                    title="Excluir Ambiente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <button
                    disabled={vm.status === 'manutencao' || (vm.status === 'em_uso' && vm.currentUserUid !== user.uid)}
                    onClick={() => handleReserve(vm.id, vm.name, vm.status)}
                    className={`btn-primary py-2.5 px-6 text-xs w-full md:w-auto font-bold tracking-wide transition-all ${
                      vm.status === 'em_uso'
                        ? vm.currentUserUid === user.uid
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-none'
                          : 'bg-slate-900 text-slate-500 border border-slate-800/80 cursor-not-allowed shadow-none'
                        : ''
                    }`}
                  >
                    {vm.status === 'em_uso'
                      ? vm.currentUserUid === user.uid ? 'Liberar VM (Check-out)' : 'Reservado'
                      : 'Reservar VM (Check-in)'
                    }
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* DIRETRIZES DO TIME (1 col) */}
        <div className="lg:col-span-1">
          <BentoCard title="Regras de Uso" subtitle="Diretrizes do Squad" icon={HelpCircle}>
            <div className="space-y-4 pt-2 text-xs text-slate-400 leading-relaxed">
              <div className="flex gap-3 items-start">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Check-in obrigatório:</strong> Sempre faça a reserva da VM antes de iniciar testes integrados.</p>
              </div>

              <div className="flex gap-3 items-start">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Check-out rápido:</strong> Ao finalizar os testes, libere a VM para que outros desenvolvedores possam utilizá-la.</p>
              </div>

              <div className="flex gap-3 items-start">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Comunicação de Manutenção:</strong> Em caso de quedas ou problemas no servidor, marque a VM como "Manutenção" (apenas admins) e comunique no Teams.</p>
              </div>

              <div className="flex gap-3 items-start">
                <Activity className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>As VMs Mississauga rodam instâncias locais do Winthor Smart Hub (WSH) e Commerce Hub (CH) integradas com o simulador de PDVSYNC.</p>
              </div>
            </div>
          </BentoCard>
        </div>

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
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">Criar Novo Ambiente</h3>
                <button 
                  onClick={() => setCreatorModalOpen(false)} 
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-6">Mapeie um novo servidor dedicado ou máquina virtual para testes integrados do time.</p>

              <form onSubmit={handleCreateEnvironment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nome do Ambiente (ex: VM-01-Winthor)</label>
                    <input
                      type="text"
                      required
                      value={envName}
                      onChange={(e) => setEnvName(e.target.value)}
                      placeholder="Ex: VM-03-Homologacao"
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">IP ou Endereço</label>
                    <input
                      type="text"
                      value={envIp}
                      onChange={(e) => setEnvIp(e.target.value)}
                      placeholder="Ex: 192.168.10.35"
                      className="premium-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Descrição</label>
                  <textarea
                    rows={3}
                    value={envDesc}
                    onChange={(e) => setEnvDesc(e.target.value)}
                    placeholder="Ex: Servidor de homologação com banco Oracle e APIs locais configuradas..."
                    className="premium-input resize-none bg-slate-950/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Status Inicial</label>
                  <select
                    value={envStatus}
                    onChange={(e) => setEnvStatus(e.target.value)}
                    className="premium-input bg-slate-950"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_uso">Em Uso</option>
                    <option value="manutencao">Manutenção</option>
                  </select>
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
                        <span>Cadastrar Ambiente</span>
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
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">Editar Ambiente</h3>
                <button 
                  onClick={() => setEditModalOpen(false)} 
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-6">Atualize os dados e a descrição do servidor.</p>

              <form onSubmit={handleEditEnvironment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nome do Ambiente</label>
                    <input
                      type="text"
                      required
                      value={editEnvName}
                      onChange={(e) => setEditEnvName(e.target.value)}
                      placeholder="Ex: VM-03-Homologacao"
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">IP ou Endereço</label>
                    <input
                      type="text"
                      value={editEnvIp}
                      onChange={(e) => setEditEnvIp(e.target.value)}
                      placeholder="Ex: 192.168.10.35"
                      className="premium-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Descrição</label>
                  <textarea
                    rows={3}
                    value={editEnvDesc}
                    onChange={(e) => setEditEnvDesc(e.target.value)}
                    placeholder="Descrição do servidor..."
                    className="premium-input resize-none bg-slate-950/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Status</label>
                  <select
                    value={editEnvStatus}
                    onChange={(e) => setEditEnvStatus(e.target.value)}
                    className="premium-input bg-slate-950"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_uso">Em Uso</option>
                    <option value="manutencao">Manutenção</option>
                  </select>
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
                <span>Excluir Ambiente?</span>
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Tem certeza que deseja excluir o ambiente <strong className="text-white">"{deletingEnv?.name}"</strong>? Esta ação é irreversível e removerá permanentemente a VM da listagem de controle de reservas.
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
                  onClick={handleDeleteEnvironment}
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

export default Environments;
