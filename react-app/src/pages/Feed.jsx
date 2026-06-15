import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  listenFeedPosts, 
  toggleLikePost, 
  addFeedPost,
  updateFeedPost,
  deleteFeedPost,
  listenComments,
  addCommentToPost
} from '../services/firestore';
import BentoCard from '../components/BentoCard';
import UserAvatar from '../components/UserAvatar';
import { MessageSquare, Plus, Heart, Search, Filter, ShieldAlert, X, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const CommentCount = ({ postId }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!postId) return;
    const unsub = listenComments(postId, (comments) => {
      setCount(comments.length);
    });
    return () => unsub();
  }, [postId]);

  return <span>{count}</span>;
};

const PostComments = ({ postId, user }) => {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!postId) return;
    const unsub = listenComments(postId, setComments);
    return () => unsub();
  }, [postId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setSubmitting(true);
    try {
      await addCommentToPost(postId, newCommentText.trim(), user);
      setNewCommentText('');
      addToast('Comentário enviado!', 'success');
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      addToast('Erro ao enviar comentário.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-800/60 pl-14 space-y-4">
      {/* List Comments */}
      {comments.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3 p-3 bg-slate-950/40 border border-slate-900/60 rounded-xl text-xs">
              <UserAvatar photoURL={comment.authorUid === user?.uid ? user?.photoURL : comment.photoURL} displayName={comment.author} sizeClass="h-7 w-7" textClass="text-[8px] font-black" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white">{comment.author}</span>
                  <span className="text-[9px] text-slate-500">
                    {comment.createdAt?.seconds 
                      ? new Date(comment.createdAt.seconds * 1000).toLocaleString('pt-BR', { timeStyle: 'short', dateStyle: 'short' }) 
                      : new Date(comment.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Input */}
      <form onSubmit={handleSubmitComment} className="flex gap-2">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Escreva um comentário..."
          className="premium-input bg-slate-950/60 text-xs py-2"
        />
        <button
          type="submit"
          disabled={submitting || !newCommentText.trim()}
          className="btn-primary py-2 px-4 rounded-xl text-xs transition-all disabled:opacity-50 shrink-0"
        >
          {submitting ? 'Enviando...' : 'Comentar'}
        </button>
      </form>
    </div>
  );
};

const Feed = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');

  // Modal e Estados do Form
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('iniciativa');
  const [postTags, setPostTags] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');

  // Estados de Edição
  const [editPostModalOpen, setEditPostModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostCategory, setEditPostCategory] = useState('iniciativa');
  const [editPostTags, setEditPostTags] = useState('');

  // Estados de Exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState(null);

  // Comentários expandidos
  const [expandedComments, setExpandedComments] = useState({});

  const toggleCommentsSection = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Escutar postagens (isolado por time)
  useEffect(() => {
    if (!user?.teamId) return;
    const unsub = listenFeedPosts(user.teamId, setPosts);
    return () => unsub();
  }, [user?.teamId]);

  const handleLikePost = async (postId, likedBy) => {
    const hasLiked = likedBy?.includes(user?.uid);
    try {
      await toggleLikePost(postId, user?.uid, hasLiked);
    } catch (err) {
      console.error('Erro ao curtir post:', err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    setLoadingSubmit(true);
    setError('');

    try {
      const tagsArray = postTags
        ? postTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
        : [];
        
      await addFeedPost({
        title: postTitle.trim(),
        content: postContent.trim(),
        category: postCategory,
        tags: tagsArray
      }, user);

      addToast('Postagem publicada no feed!', 'success');
      // Resetar form
      setPostTitle('');
      setPostContent('');
      setPostCategory('iniciativa');
      setPostTags('');
      setNewPostModalOpen(false);
    } catch (err) {
      console.error(err);
      setError('Erro ao publicar postagem. Verifique sua conexão.');
      addToast('Erro ao publicar postagem.', 'error');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleOpenEditModal = (post) => {
    setEditingPostId(post.id);
    setEditPostTitle(post.title || '');
    setEditPostContent(post.content || '');
    setEditPostCategory(post.category || 'iniciativa');
    setEditPostTags(post.tags ? post.tags.join(', ') : '');
    setEditPostModalOpen(true);
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    if (!editPostTitle.trim() || !editPostContent.trim() || !editingPostId) return;
    setLoadingSubmit(true);
    setError('');

    try {
      const tagsArray = editPostTags
        ? editPostTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
        : [];

      await updateFeedPost(editingPostId, {
        title: editPostTitle.trim(),
        content: editPostContent.trim(),
        category: editPostCategory,
        tags: tagsArray
      }, user);

      addToast('Postagem atualizada com sucesso!', 'success');
      setEditPostModalOpen(false);
      setEditingPostId(null);
    } catch (err) {
      console.error(err);
      setError('Erro ao editar postagem. Verifique sua conexão.');
      addToast('Erro ao editar postagem.', 'error');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleOpenDeleteConfirm = (post) => {
    setDeletingPost(post);
    setDeleteConfirmOpen(true);
  };

  const handleDeletePost = async () => {
    if (!deletingPost) return;
    setLoadingSubmit(true);
    setError('');
    try {
      await deleteFeedPost(deletingPost.id, user, deletingPost.title);
      addToast('Postagem excluída!', 'success');
      setDeleteConfirmOpen(false);
      setDeletingPost(null);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir postagem. Verifique sua conexão.');
      addToast('Erro ao excluir postagem.', 'error');
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Filtrar postagens baseadas em busca e categoria
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'todos' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER E AÇÃO PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Feed de Iniciativas</h1>
          <p className="text-sm text-slate-400">O que está rolando de novo no time e squads.</p>
        </div>
        
        <button
          onClick={() => setNewPostModalOpen(true)}
          className="btn-primary py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Postagem</span>
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 border border-slate-900 p-4 rounded-xl backdrop-blur-md">
        {/* Barra de Busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por título, conteúdo ou tags..."
            className="premium-input pl-10"
          />
        </div>

        {/* Filtro por Categoria */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-indigo-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="premium-input bg-slate-950 py-2.5 text-xs w-full md:w-48"
          >
            <option value="todos">Todas as categorias</option>
            <option value="iniciativa">Iniciativas</option>
            <option value="ideia">Ideias</option>
            <option value="duvida">Dúvidas</option>
            <option value="link">Dicas & Links</option>
            <option value="skill">AI Skills</option>
          </select>
        </div>
      </div>

      {/* TIMELINE DE POSTS */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <BentoCard title="Nenhuma postagem" subtitle="Sem resultados">
            <div className="text-center py-16">
              <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-sm text-slate-400">Nenhum post corresponde aos critérios de pesquisa ou categoria selecionada.</p>
            </div>
          </BentoCard>
        ) : (
          filteredPosts.map((post) => {
            const hasLiked = post.likedBy?.includes(user?.uid);
            const isCommentsExpanded = !!expandedComments[post.id];
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl hover:border-slate-800/60 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all space-y-4 relative group"
              >
                {/* Linha vertical decorativa */}
                <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r bg-indigo-500/30 group-hover:bg-indigo-500 transition-colors"></div>

                <div className="flex items-start gap-4">
                  {/* Foto do autor com UserAvatar */}
                  <UserAvatar photoURL={post.authorUid === user?.uid ? user?.photoURL : ''} displayName={post.author} sizeClass="h-10 w-10" />
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="font-extrabold text-base text-white">{post.title}</h4>
                      <div className="flex items-center gap-2">
                        {post.authorUid === user?.uid && (
                          <div className="flex items-center gap-1 mr-2">
                            <button
                              onClick={() => handleOpenEditModal(post)}
                              className="p-1 rounded bg-slate-950 border border-slate-900 text-slate-400 hover:text-white hover:border-slate-800 transition-all"
                              title="Editar Postagem"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteConfirm(post)}
                              className="p-1 rounded bg-slate-950 border border-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-900/30 transition-all"
                              title="Excluir Postagem"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {post.category}
                        </span>
                        {post.teamId && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {post.teamId.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-500">
                      Publicado por <strong className="text-slate-400">{post.author}</strong> • {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : new Date(post.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap pl-14">{post.content}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900/60 pl-14">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags?.map((tag, i) => (
                      <span key={i} className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-900 font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Ações (Comentar e Curtir) */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCommentsSection(post.id)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                        isCommentsExpanded
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'text-slate-500 border-slate-800 hover:text-indigo-400 hover:bg-indigo-500/5 hover:border-indigo-500/20'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <CommentCount postId={post.id} />
                    </button>

                    <button
                      onClick={() => handleLikePost(post.id, post.likedBy)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                        hasLiked
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                          : 'text-slate-500 border-slate-800 hover:text-rose-400 hover:bg-rose-500/5 hover:border-rose-500/20'
                      }`}
                    >
                      <Heart className={`h-4 w-4 transition-all ${hasLiked ? 'fill-rose-400 text-rose-400 scale-110' : 'group-hover:scale-110'}`} />
                      <span>{post.likes || 0}</span>
                    </button>
                  </div>
                </div>

                {/* Seção de Comentários */}
                {isCommentsExpanded && (
                  <PostComments postId={post.id} user={user} />
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* MODAL DE NOVA POSTAGEM */}
      <AnimatePresence>
        {newPostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setNewPostModalOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">Criar Nova Postagem</h3>
                <button 
                  onClick={() => setNewPostModalOpen(false)} 
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-6">Compartilhe iniciativas, ideias ou links com a equipe.</p>

              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Título</label>
                    <input
                      type="text"
                      required
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder="Ex: Novo Gateway de APIs"
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Categoria</label>
                    <select
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value)}
                      className="premium-input bg-slate-950"
                    >
                      <option value="iniciativa">Iniciativa</option>
                      <option value="ideia">Ideia</option>
                      <option value="duvida">Dúvida</option>
                      <option value="link">Dica/Link</option>
                      <option value="skill">AI Skill</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Descrição do Post</label>
                  <textarea
                    required
                    rows={4}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Escreva sobre a iniciativa..."
                    className="premium-input resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={postTags}
                    onChange={(e) => setPostTags(e.target.value)}
                    placeholder="Ex: api, java, bento"
                    className="premium-input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setNewPostModalOpen(false)}
                    className="btn-secondary py-2.5 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loadingSubmit}
                    className="btn-primary py-2.5 text-xs"
                  >
                    {loadingSubmit ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      'Publicar Post'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE EDIÇÃO DE POSTAGEM */}
      <AnimatePresence>
        {editPostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setEditPostModalOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">Editar Postagem</h3>
                <button 
                  onClick={() => setEditPostModalOpen(false)} 
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-6">Atualize o conteúdo de sua postagem no Feed.</p>

              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleEditPost} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Título</label>
                    <input
                      type="text"
                      required
                      value={editPostTitle}
                      onChange={(e) => setEditPostTitle(e.target.value)}
                      placeholder="Ex: Novo Gateway de APIs"
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Categoria</label>
                    <select
                      value={editPostCategory}
                      onChange={(e) => setEditPostCategory(e.target.value)}
                      className="premium-input bg-slate-950"
                    >
                      <option value="iniciativa">Iniciativa</option>
                      <option value="ideia">Ideia</option>
                      <option value="duvida">Dúvida</option>
                      <option value="link">Dica/Link</option>
                      <option value="skill">AI Skill</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Descrição do Post</label>
                  <textarea
                    required
                    rows={4}
                    value={editPostContent}
                    onChange={(e) => setEditPostContent(e.target.value)}
                    placeholder="Escreva sobre a iniciativa..."
                    className="premium-input resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={editPostTags}
                    onChange={(e) => setEditPostTags(e.target.value)}
                    placeholder="Ex: api, java, bento"
                    className="premium-input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditPostModalOpen(false)}
                    className="btn-secondary py-2.5 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loadingSubmit}
                    className="btn-primary py-2.5 text-xs"
                  >
                    {loadingSubmit ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE POSTAGEM */}
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
                <span>Excluir Postagem?</span>
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Tem certeza que deseja excluir a postagem <strong className="text-white">"{deletingPost?.title}"</strong>? Esta ação é irreversível e apagará permanentemente o conteúdo do Feed do time.
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
                  disabled={loadingSubmit}
                  onClick={handleDeletePost}
                  className="bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {loadingSubmit ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>Excluir</span>
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

export default Feed;
