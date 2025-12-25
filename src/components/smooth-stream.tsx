"use client";

import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

// --- COMPONENTE AUXILIAR: CodeBlock ---
const CodeBlock = ({ language, value }: { language: string, value: string }) => {
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  return (
    <div className="bg-[#0d0d0d] rounded-md my-4 border border-white/10 overflow-hidden relative group font-sans">
      <div className="bg-white/5 px-4 py-2 text-xs text-zinc-400 border-b border-white/5 flex justify-between items-center select-none">
        <span className="font-mono lowercase">{language || 'texto'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
          {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          <span className="text-[10px] uppercase tracking-wider">{isCopied ? 'Copiado!' : 'Copiar'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-zinc-200 whitespace-pre">{value}</code>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL: SmoothStream Inteligente ---
export function SmoothStream({ content }: { content: string }) {
  // TRUQUE DE MESTRE:
  // Se ao nascer o conteúdo já for maior que 20 caracteres, assumimos que é histórico
  // e mostramos tudo de uma vez. Se for menor, é um stream novo e começamos vazio.
  const [displayedContent, setDisplayedContent] = useState(
    content.length > 20 ? content : ""
  );

  // Ref para controlar se já terminamos a animação (para não re-animar em re-renders)
  const isComplete = useRef(content.length > 20);

  useEffect(() => {
    // Se já completou, apenas atualize caso o conteúdo mude drasticamente (ex: edição)
    if (isComplete.current) {
      // Se o conteúdo diminuiu (ex: limpou chat), reseta
      if (content.length < displayedContent.length) {
        setDisplayedContent(content);
        isComplete.current = false;
      } else {
        // Se apenas cresceu um pouco (chunk final), atualiza direto para evitar delay
        setDisplayedContent(content);
      }
      return;
    }

    // LÓGICA DE ANIMAÇÃO
    if (content.length > displayedContent.length) {
      const interval = setInterval(() => {
        setDisplayedContent((prev) => {
          const nextIndex = prev.length;

          // Se alcançou o final, marca como completo
          if (nextIndex >= content.length) {
            clearInterval(interval);
            isComplete.current = true;
            return content;
          }

          // VELOCIDADE DA DIGITAÇÃO
          // Calculamos o 'backlog' (quantas letras estão na fila esperando para aparecer)
          const backlog = content.length - nextIndex;

          // Se tiver muita coisa acumulada (>50 letras), acelera (3 por vez)
          // Se tiver pouco, vai suave (1 por vez)
          // Isso evita que textos longos demorem uma eternidade
          const charsToAdd = backlog > 50 ? 3 : 1;

          return content.slice(0, nextIndex + charsToAdd);
        });
      }, 15); // 15ms = Velocidade suave e humana

      return () => clearInterval(interval);
    }
  }, [content, displayedContent.length]);

  return (
    <div className="text-zinc-100 leading-7 text-[15px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const value = String(children).replace(/\n$/, '');
            return !inline ? <CodeBlock language={match ? match[1] : ''} value={value} /> : <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-200" {...props}>{children}</code>
          },
          ul: ({ children }) => <ul className="list-disc pl-4 mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="marker:text-zinc-500">{children}</li>,
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
          p: ({ children }) => <p className="mb-4 last:mb-0 leading-7">{children}</p>,
          a: ({ children, href }) => <a href={href} target="_blank" className="text-blue-400 hover:underline">{children}</a>
        }}
      >
        {displayedContent}
      </ReactMarkdown>

      {/* Cursor piscante: Só aparece se ainda não terminamos de mostrar tudo */}
      {!isComplete.current && content.length > displayedContent.length && (
        <span className="inline-block w-1.5 h-4 bg-zinc-400 animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}