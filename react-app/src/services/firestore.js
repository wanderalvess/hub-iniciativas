import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs, 
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  writeBatch,
  setDoc,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { db } from './firebase';

export const addWorkflowRoutesBatch = async (routes) => {
  const batch = writeBatch(db);
  routes.forEach((route) => {
    // Cria referência de documento com ID gerado automaticamente na coleção workflow_routes
    const routeRef = doc(collection(db, 'workflow_routes'));
    batch.set(routeRef, route);
  });
  
  batch.commit().catch((err) => {
    console.error("Erro ao comitar lote de rotas:", err);
  });
};

// ==========================================
// 1. Feed de Iniciativas
// ==========================================

export const listenFeedPosts = (teamId, callback) => {
  if (!teamId) return () => {};
  const q = query(collection(db, 'feed'), where('teamId', '==', teamId));
  return onSnapshot(q, (snapshot) => {
    const posts = [];
    snapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar localmente por createdAt desc
    posts.sort((a, b) => {
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
      return (dateB || 0) - (dateA || 0);
    });
    callback(posts);
  });
};

export const addFeedPost = async (postData, user) => {
  if (!user) return;
  const newPost = {
    title: postData.title,
    content: postData.content,
    category: postData.category || 'iniciativa',
    status: postData.status || 'planejado',
    tags: postData.tags || [],
    author: user.displayName || 'Membro do Time',
    authorUid: user.uid,
    teamId: user.teamId || 'mississauga',
    likes: 0,
    likedBy: [],
    createdAt: new Date()
  };
  const postRef = doc(collection(db, 'feed'));
  setDoc(postRef, newPost).then(() => {
    writeAuditLog(user, 'create_post', `Criou a postagem: "${postData.title}"`);
  }).catch((err) => {
    console.error("Erro ao criar postagem no feed:", err);
  });
  return { id: postRef.id, ...newPost };
};

export const toggleLikePost = async (postId, userId, hasLiked) => {
  const postRef = doc(db, 'feed', postId);
  const docSnap = await getDoc(postRef);
  if (!docSnap.exists()) return;
  const currentLikes = docSnap.data().likes || 0;

  if (hasLiked) {
    return updateDoc(postRef, {
      likes: Math.max(0, currentLikes - 1),
      likedBy: arrayRemove(userId)
    });
  } else {
    return updateDoc(postRef, {
      likes: currentLikes + 1,
      likedBy: arrayUnion(userId)
    });
  }
};

// ==========================================
// 2. Ambientes (VMs)
// ==========================================

export const listenEnvironments = (teamId, callback) => {
  if (!teamId) return () => {};
  const q = query(collection(db, 'environments'), where('teamId', '==', teamId));
  return onSnapshot(q, (snapshot) => {
    const vms = [];
    snapshot.forEach((doc) => {
      vms.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar localmente por name asc
    vms.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    callback(vms);
  });
};

export const reserveEnvironment = async (envId, envName, user, currentStatus) => {
  if (!user) return;
  const envRef = doc(db, 'environments', envId);

  if (currentStatus === 'em_uso') {
    // Liberar
    return updateDoc(envRef, {
      status: 'disponivel',
      currentUser: '',
      currentUserUid: '',
      lastUpdated: new Date()
    }).then(() => {
      writeAuditLog(user, 'release_environment', `Liberou o ambiente: "${envName || envId}"`);
    });
  } else {
    // Reservar
    return updateDoc(envRef, {
      status: 'em_uso',
      currentUser: user.displayName,
      currentUserUid: user.uid,
      lastUpdated: new Date()
    }).then(() => {
      writeAuditLog(user, 'reserve_environment', `Reservou o ambiente: "${envName || envId}"`);
    });
  }
};

// ==========================================
// 3. AI Skills & Prompts
// ==========================================

export const listenAISkills = (teamId, callback) => {
  if (!teamId) return () => {};
  const q = query(collection(db, 'ai_skills'), where('teamId', '==', teamId));
  return onSnapshot(q, (snapshot) => {
    const skills = [];
    snapshot.forEach((doc) => {
      skills.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar localmente por name asc
    skills.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    callback(skills);
  });
};

export const addAISkill = async (skillData, user) => {
  if (!user) return;
  const newSkill = {
    name: skillData.name,
    description: skillData.description,
    promptTemplate: skillData.promptTemplate,
    arguments: skillData.arguments || [],
    type: skillData.type || 'Outro',
    status: skillData.status || 'Ativo',
    impact: skillData.impact || 'Médio',
    businessGoal: skillData.businessGoal || '',
    copyCounter: 0,
    author: user.displayName || 'Membro do Time',
    authorUid: user.uid,
    teamId: user.teamId || 'mississauga',
    updatedAt: new Date()
  };
  const skillRef = doc(collection(db, 'ai_skills'));
  setDoc(skillRef, newSkill).then(() => {
    writeAuditLog(user, 'create_skill', `Criou a AI Skill: "${skillData.name}"`);
  }).catch((err) => {
    console.error("Erro ao criar AI Skill:", err);
  });
  return { id: skillRef.id, ...newSkill };
};

// ==========================================
// 4. Workflows & Rotas
// ==========================================

export const listenWorkflows = (teamId, callback) => {
  if (!teamId) return () => {};
  const q = query(collection(db, 'workflows'), where('teamId', '==', teamId));
  return onSnapshot(q, (snapshot) => {
    const workflows = [];
    snapshot.forEach((doc) => {
      workflows.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar localmente por createdAt desc
    workflows.sort((a, b) => {
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
      return (dateB || 0) - (dateA || 0);
    });
    callback(workflows);
  });
};

export const addWorkflow = async (wfData, user) => {
  if (!user) return;
  const newWf = {
    name: wfData.name,
    systemMaster: wfData.systemMaster || '',
    integrators: wfData.integrators || [],
    destiny: wfData.destiny || '',
    teamId: user.teamId || '',
    createdAt: new Date(),
    createdBy: user.displayName || 'Membro do Time'
  };

  const wfRef = doc(collection(db, 'workflows'));
  
  setDoc(wfRef, newWf).then(() => {
    writeAuditLog(user, 'create_workflow', `Criou o workflow: "${wfData.name}"`);
  }).catch((err) => {
    console.error("Erro ao salvar workflow:", err);
  });

  return { id: wfRef.id, ...newWf };
};

export const listenWorkflowRoutes = (workflowId, callback) => {
  if (!workflowId) return () => {};
  const q = query(collection(db, 'workflow_routes'), where('workflowId', '==', workflowId));
  return onSnapshot(q, (snapshot) => {
    const routes = [];
    snapshot.forEach((doc) => {
      routes.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar localmente por fluxo asc
    routes.sort((a, b) => a.fluxo.localeCompare(b.fluxo));
    callback(routes);
  });
};

export const addWorkflowRoute = async (routeData) => {
  return addDoc(collection(db, 'workflow_routes'), routeData);
};

export const updateWorkflowRoute = async (routeId, routeData) => {
  const routeRef = doc(db, 'workflow_routes', routeId);
  return updateDoc(routeRef, routeData);
};

export const deleteWorkflowRoute = async (routeId) => {
  const routeRef = doc(db, 'workflow_routes', routeId);
  return deleteDoc(routeRef);
};

// ==========================================
// 5. Gestão de Times (Onboarding)
// ==========================================

export const listenTeams = (callback) => {
  const q = query(collection(db, 'teams'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const teams = [];
    snapshot.forEach((doc) => {
      teams.push({ id: doc.id, ...doc.data() });
    });
    callback(teams);
  });
};

export const createTeam = async (teamName) => {
  if (!teamName) return;
  const slug = teamName.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  const teamRef = doc(db, 'teams', slug);
  
  try {
    const teamSnap = await getDoc(teamRef);
    if (teamSnap.exists()) {
      throw new Error('Este time já está cadastrado.');
    }
  } catch (err) {
    // Se o erro for de conexão/offline, ignora e permite a criação no cache local do Firestore
    const isOfflineErr = err.code === 'unavailable' || 
                         err.message?.includes('offline') || 
                         err.message?.includes('Failed to get document');
    
    if (!isOfflineErr) {
      throw err;
    }
    console.warn("Cliente offline detectado ao verificar time. Cadastrando no banco local.");
  }

  const newTeam = {
    name: teamName,
    createdAt: new Date()
  };
  await setDoc(teamRef, newTeam);
  return { id: slug, ...newTeam };
};

export const updateUserTeam = async (uid, teamId, associatedTeams = null) => {
  const userRef = doc(db, 'users', uid);
  const updateData = { teamId };
  if (associatedTeams) {
    updateData.associatedTeams = associatedTeams;
  } else {
    updateData.associatedTeams = arrayUnion(teamId);
  }
  try {
    await updateDoc(userRef, updateData);
  } catch (err) {
    const isOfflineErr = err.code === 'unavailable' || 
                         err.message?.includes('offline') || 
                         err.message?.includes('Failed to get document');
    if (!isOfflineErr) {
      throw err;
    }
    console.warn("Cliente offline detectado ao salvar time do usuário. Prosseguindo localmente.");
  }
};

export const listenTeamMembers = (teamId, callback) => {
  if (!teamId) return () => {};
  const q = query(collection(db, 'users'), where('associatedTeams', 'array-contains', teamId));
  return onSnapshot(q, (snapshot) => {
    const members = [];
    snapshot.forEach((doc) => {
      members.push({ uid: doc.id, ...doc.data() });
    });
    callback(members);
  }, (err) => {
    console.error("Erro no listenTeamMembers:", err);
  });
};

export const addUserToTeam = async (targetUid, teamId) => {
  const userRef = doc(db, 'users', targetUid);
  try {
    await updateDoc(userRef, {
      associatedTeams: arrayUnion(teamId)
    });
  } catch (err) {
    console.error("Erro ao adicionar usuário ao time:", err);
    throw err;
  }
};


// ==========================================
// 6. Edição e Exclusão de Recursos (CRUD & Times)
// ==========================================

export const updateWorkflow = async (workflowId, wfData, user) => {
  const wfRef = doc(db, 'workflows', workflowId);
  updateDoc(wfRef, {
    name: wfData.name,
    systemMaster: wfData.systemMaster,
    destiny: wfData.destiny,
    integrators: wfData.integrators,
    updatedAt: new Date()
  }).then(() => {
    writeAuditLog(user, 'update_workflow', `Atualizou o workflow: "${wfData.name}"`);
  }).catch((err) => {
    console.error("Erro ao atualizar workflow:", err);
  });
};

export const deleteWorkflow = async (workflowId, user, workflowName) => {
  const wfRef = doc(db, 'workflows', workflowId);
  
  deleteDoc(wfRef).then(() => {
    writeAuditLog(user, 'delete_workflow', `Excluiu o workflow: "${workflowName || workflowId}"`);
  }).catch((err) => {
    console.error("Erro ao excluir workflow:", err);
  });

  // Deleta todas as rotas vinculadas
  const q = query(collection(db, 'workflow_routes'), where('workflowId', '==', workflowId));
  getDocs(q).then((snapshot) => {
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.forEach((routeDoc) => {
        batch.delete(routeDoc.ref);
      });
      batch.commit().catch((err) => {
        console.error("Erro ao excluir rotas vinculadas:", err);
      });
    }
  }).catch((err) => {
    console.error("Erro ao buscar rotas para exclusão:", err);
  });
};

// CRUD - Feed de Iniciativas
export const updateFeedPost = async (postId, postData, user) => {
  const postRef = doc(db, 'feed', postId);
  updateDoc(postRef, {
    title: postData.title,
    content: postData.content,
    category: postData.category,
    tags: postData.tags || [],
    updatedAt: new Date()
  }).then(() => {
    writeAuditLog(user, 'update_post', `Atualizou a postagem: "${postData.title}"`);
  }).catch((err) => {
    console.error("Erro ao atualizar postagem:", err);
  });
};

export const deleteFeedPost = async (postId, user, postTitle) => {
  const postRef = doc(db, 'feed', postId);
  deleteDoc(postRef).then(() => {
    writeAuditLog(user, 'delete_post', `Excluiu a postagem: "${postTitle || postId}"`);
  }).catch((err) => {
    console.error("Erro ao deletar postagem:", err);
  });
};



// CRUD - AI Skills
export const updateAISkill = async (skillId, skillData, user) => {
  const skillRef = doc(db, 'ai_skills', skillId);
  updateDoc(skillRef, {
    name: skillData.name,
    description: skillData.description,
    promptTemplate: skillData.promptTemplate,
    arguments: skillData.arguments || [],
    type: skillData.type || 'Outro',
    status: skillData.status || 'Ativo',
    impact: skillData.impact || 'Médio',
    businessGoal: skillData.businessGoal || '',
    updatedAt: new Date()
  }).then(() => {
    writeAuditLog(user, 'update_skill', `Atualizou a AI Skill: "${skillData.name}"`);
  }).catch((err) => {
    console.error("Erro ao atualizar AI Skill:", err);
  });
};

export const incrementAISkillCopyCount = async (skillId) => {
  const skillRef = doc(db, 'ai_skills', skillId);
  return updateDoc(skillRef, {
    copyCounter: increment(1)
  }).catch((err) => {
    console.error("Erro ao incrementar contador de cópias:", err);
  });
};

export const deleteAISkill = async (skillId, user, skillName) => {
  const skillRef = doc(db, 'ai_skills', skillId);
  deleteDoc(skillRef).then(() => {
    writeAuditLog(user, 'delete_skill', `Excluiu a AI Skill: "${skillName || skillId}"`);
  }).catch((err) => {
    console.error("Erro ao deletar AI Skill:", err);
  });
};

// ==========================================
// 8. Base de Conhecimento (Wiki / KB)
// ==========================================

export const listenKnowledgeDocs = (teamId, callback) => {
  if (!teamId) return () => {};
  const q = query(collection(db, 'knowledge_kb'), where('teamId', '==', teamId));
  return onSnapshot(q, (snapshot) => {
    const docs = [];
    snapshot.forEach((doc) => {
      docs.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar localmente por updatedAt desc
    docs.sort((a, b) => {
      const dateA = a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : new Date(a.updatedAt).getTime();
      const dateB = b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : new Date(b.updatedAt).getTime();
      return (dateB || 0) - (dateA || 0);
    });
    callback(docs);
  });
};

export const addKnowledgeDoc = async (docData, user) => {
  if (!user) return;
  const newDoc = {
    title: docData.title,
    content: docData.content,
    category: docData.category || 'Geral',
    tags: docData.tags || [],
    author: user.displayName || 'Membro do Time',
    authorUid: user.uid,
    teamId: user.teamId || 'mississauga',
    sourceUrl: docData.sourceUrl || '',
    updatedAt: new Date()
  };
  const docRef = doc(collection(db, 'knowledge_kb'));
  await setDoc(docRef, newDoc);
  await writeAuditLog(user, 'create_kb_doc', `Criou o documento: "${docData.title}"`);
  return { id: docRef.id, ...newDoc };
};

export const updateKnowledgeDoc = async (docId, docData, user) => {
  const docRef = doc(db, 'knowledge_kb', docId);
  await updateDoc(docRef, {
    title: docData.title,
    content: docData.content,
    category: docData.category,
    tags: docData.tags || [],
    sourceUrl: docData.sourceUrl || '',
    updatedAt: new Date()
  });
  await writeAuditLog(user, 'update_kb_doc', `Atualizou o documento: "${docData.title}"`);
};

export const deleteKnowledgeDoc = async (docId, user, docTitle) => {
  const docRef = doc(db, 'knowledge_kb', docId);
  await deleteDoc(docRef);
  await writeAuditLog(user, 'delete_kb_doc', `Excluiu o documento: "${docTitle || docId}"`);
};

export const importTdnPageToKnowledge = async (baseUrl, token, pageId, user, category) => {
  if (!baseUrl || !token || !pageId) throw new Error("Parâmetros inválidos.");
  
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const url = `${cleanBaseUrl}/rest/api/content/${pageId}?expand=body.storage`;
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token.startsWith('Basic') || token.startsWith('Bearer')) {
    headers['Authorization'] = token;
  } else {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Falha ao conectar ao TDN (${response.status})`);
  }
  
  const data = await response.json();
  const title = data.title || `Documento ${pageId}`;
  const htmlContent = data.body?.storage?.value || '';
  
  let cleanContent = htmlContent
    .replace(/<ac:[^>]*>/g, '')
    .replace(/<\/ac:[^>]*>/g, '')
    .replace(/<ri:[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  const docRef = doc(collection(db, 'knowledge_kb'));
  const newDoc = {
    title: `[TDN] ${title}`,
    content: cleanContent,
    category: category || 'Importado / TDN',
    tags: ['TDN'],
    author: user.displayName || 'Membro do Time',
    authorUid: user.uid,
    teamId: user.teamId || 'mississauga',
    sourceUrl: `${cleanBaseUrl}/pages/viewpage.action?pageId=${pageId}`,
    updatedAt: new Date()
  };
  
  await setDoc(docRef, newDoc);
  await writeAuditLog(user, 'import_tdn', `Importou documento TDN: "${title}"`);
  return { id: docRef.id, ...newDoc };
};

export const addEnvironment = async (envData, user) => {
  if (!user) return;
  const newEnv = {
    name: envData.name,
    ip: envData.ip || '',
    description: envData.description || '',
    status: envData.status || 'disponivel', // 'disponivel', 'em_uso', 'manutencao'
    teamId: user.teamId || 'mississauga',
    currentUser: '',
    currentUserUid: '',
    lastUpdated: new Date()
  };

  const envRef = doc(collection(db, 'environments'));
  
  setDoc(envRef, newEnv).then(() => {
    writeAuditLog(user, 'create_environment', `Criou o ambiente: "${envData.name}"`);
  }).catch((err) => {
    console.error("Erro ao criar ambiente:", err);
  });

  return { id: envRef.id, ...newEnv };
};

export const updateEnvironment = async (envId, envData, user) => {
  const envRef = doc(db, 'environments', envId);
  updateDoc(envRef, {
    name: envData.name,
    ip: envData.ip,
    description: envData.description,
    status: envData.status,
    lastUpdated: new Date()
  }).then(() => {
    writeAuditLog(user, 'update_environment', `Atualizou o ambiente: "${envData.name}"`);
  }).catch((err) => {
    console.error("Erro ao atualizar ambiente:", err);
  });
};

export const deleteEnvironment = async (envId, user, envName) => {
  const envRef = doc(db, 'environments', envId);
  deleteDoc(envRef).then(() => {
    writeAuditLog(user, 'delete_environment', `Excluiu o ambiente: "${envName || envId}"`);
  }).catch((err) => {
    console.error("Erro ao deletar ambiente:", err);
  });
};

// ==========================================
// 7. Auditoria Geral & Comentários (Fase 8)
// ==========================================

export const writeAuditLog = async (user, action, details) => {
  if (!user) return;
  const newLog = {
    userId: user.uid,
    userName: user.displayName || 'Membro do Time',
    userEmail: user.email || '',
    userPhoto: user.photoURL || '',
    action,
    details,
    teamId: user.teamId || '',
    timestamp: new Date()
  };
  const logRef = doc(collection(db, 'audit_logs'));
  return setDoc(logRef, newLog).catch((err) => {
    console.error("Erro ao gravar log de auditoria:", err);
  });
};

export const listenAuditLogs = (teamId, callback) => {
  if (!teamId) return () => {};
  const q = query(collection(db, 'audit_logs'), where('teamId', '==', teamId));
  return onSnapshot(q, (snapshot) => {
    const logs = [];
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar localmente por timestamp desc
    logs.sort((a, b) => {
      const dateA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
      const dateB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
      return (dateB || 0) - (dateA || 0);
    });
    callback(logs);
  });
};

export const listenComments = (postId, callback) => {
  if (!postId) return () => {};
  const q = query(collection(db, 'feed', postId, 'comments'));
  return onSnapshot(q, (snapshot) => {
    const comments = [];
    snapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar localmente por createdAt asc
    comments.sort((a, b) => {
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
      return (dateA || 0) - (dateB || 0);
    });
    callback(comments);
  });
};

export const addCommentToPost = async (postId, commentText, user) => {
  if (!user || !postId || !commentText.trim()) return;
  const newComment = {
    content: commentText.trim(),
    author: user.displayName || 'Membro do Time',
    authorUid: user.uid,
    photoURL: user.photoURL || '',
    createdAt: new Date()
  };
  const commentRef = doc(collection(db, 'feed', postId, 'comments'));
  await setDoc(commentRef, newComment).catch((err) => {
    console.error("Erro ao adicionar comentário:", err);
  });
  
  await writeAuditLog(user, 'add_comment', `Comentou na postagem de ID: ${postId}`);
  return { id: commentRef.id, ...newComment };
};

export const submitFeedback = async (feedbackData) => {
  const feedbackRef = doc(collection(db, 'feedbacks'));
  return setDoc(feedbackRef, {
    ...feedbackData,
    timestamp: new Date()
  });
};


