import React, { useEffect, useRef, useState } from 'react';

const Mermaid = ({ chart }) => {
  const ref = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      if (!window.mermaid) {
        console.warn("Mermaid.js não está carregado globalmente.");
        return;
      }

      try {
        setError(false);
        // Inicializa o Mermaid com configurações de tema escuro e de visualização
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          themeVariables: {
            background: '#0f172a', // slate-900
            primaryColor: '#312e81', // indigo-950
            primaryBorderColor: '#6366f1', // indigo-500
            primaryTextColor: '#f8fafc', // slate-50
            lineColor: '#475569', // slate-600
            secondaryColor: '#1e1b4b', // purple-950
            tertiaryColor: '#0f172a',
          },
          flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
          sequence: { useMaxWidth: true, actorMargin: 90 },
          gantt: { useMaxWidth: true }
        });

        // Gera um ID único para o render
        const id = 'mermaid-' + Math.random().toString(36).substring(2, 9);
        const { svg: renderedSvg } = await window.mermaid.render(id, chart);
        
        if (isMounted) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error("Erro ao renderizar diagrama Mermaid:", err);
        if (isMounted) {
          setError(true);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-center">
        Falha ao renderizar o fluxograma visual.
      </div>
    );
  }

  return (
    <div 
      ref={ref} 
      className="mermaid-wrapper w-full flex justify-center bg-slate-950/40 p-5 rounded-2xl border border-slate-900 overflow-x-auto select-none"
      dangerouslySetInnerHTML={{ __html: svg || '<div class="text-xs text-slate-500 animate-pulse py-4 text-center">Desenhando diagrama...</div>' }}
    />
  );
};

export default Mermaid;
