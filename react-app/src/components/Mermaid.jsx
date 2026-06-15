import React, { useEffect, useRef, useState } from 'react';

const Mermaid = ({ chart }) => {
  const ref = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');

  useEffect(() => {
    const checkTheme = () => {
      const isLight = document.querySelector('.light-theme') !== null;
      setCurrentTheme(isLight ? 'light' : 'dark');
    };
    
    checkTheme();

    const observer = new MutationObserver(() => {
      checkTheme();
    });

    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      if (!window.mermaid) {
        console.warn("Mermaid.js não está carregado globalmente.");
        return;
      }

      try {
        setError(false);
        const isLight = currentTheme === 'light';

        // Inicializa o Mermaid com configurações dependentes do tema atual
        window.mermaid.initialize({
          startOnLoad: false,
          theme: isLight ? 'default' : 'dark',
          securityLevel: 'loose',
          themeVariables: isLight ? {
            background: '#ffffff',
            primaryColor: '#f1f5f9', // slate-100
            primaryBorderColor: '#6366f1', // indigo-500
            primaryTextColor: '#0f172a', // slate-900
            lineColor: '#64748b', // slate-500
            secondaryColor: '#f8fafc', // slate-50
            tertiaryColor: '#ffffff',
            actorBkg: '#f1f5f9',
            actorBorder: '#6366f1',
            actorTextColor: '#0f172a',
            actorLineColor: '#64748b',
            signalColor: '#0f172a',
            signalTextColor: '#0f172a',
            labelBoxBkgColor: '#f1f5f9',
            labelBoxBorderColor: '#6366f1',
            labelTextColor: '#0f172a',
            loopTextColor: '#0f172a',
            noteBkgColor: '#fef08a', // yellow-200
            noteBorderColor: '#eab308', // yellow-500
            noteTextColor: '#854d0e', // yellow-800
          } : {
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
  }, [chart, currentTheme]);

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
