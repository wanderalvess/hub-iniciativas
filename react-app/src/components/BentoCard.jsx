import React from 'react';
import { motion } from 'framer-motion';

const BentoCard = ({ children, className = '', title, subtitle, icon: Icon, onClick }) => {
  const CardWrapper = onClick ? motion.button : motion.div;
  
  const additionalProps = onClick ? {
    onClick,
    whileHover: { y: -4 },
    whileTap: { scale: 0.98 }
  } : {};

  return (
    <CardWrapper
      {...additionalProps}
      className={`bento-card text-left ${className} ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20' : ''}`}
    >
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-0.5">
            {title && <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          {Icon && (
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      )}
      <div className="h-full">{children}</div>
    </CardWrapper>
  );
};

export default BentoCard;
