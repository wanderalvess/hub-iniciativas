import React, { useState, useEffect } from 'react';

const UserAvatar = ({ photoURL, displayName, sizeClass = "h-10 w-10", textClass = "text-xs font-bold" }) => {
  const [imgError, setImgError] = useState(false);

  // Se a URL mudar, reseta o estado de erro
  useEffect(() => {
    setImgError(false);
  }, [photoURL]);

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={displayName || "Avatar"}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full border border-slate-700/80 p-0.5 object-cover bg-slate-900 transition-all`}
      />
    );
  }

  // Fallback: Iniciais com gradiente moderno
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className={`${sizeClass} rounded-full border border-slate-700/80 p-0.5 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white avatar-fallback shadow-[0_0_10px_rgba(99,102,241,0.2)] select-none shrink-0`}>
      <span className={textClass}>{getInitials(displayName)}</span>
    </div>
  );
};

export default UserAvatar;
