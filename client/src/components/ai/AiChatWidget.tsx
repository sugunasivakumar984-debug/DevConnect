import { useState } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import { useAiChat } from '../../api/hooks';
import { useUiStore } from '../../stores/uiStore';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

/** Floating in-app AI assistant (uses the free OpenRouter chat model). */
export function AiChatWidget() {
  const { aiChatOpen, toggleAiChat } = useUiStore();
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const chat = useAiChat();

  const send = async () => {
    const message = input.trim();
    if (!message) return;
    setInput('');
    const history = turns.slice(-6);
    setTurns((t) => [...t, { role: 'user', content: message }]);
    try {
      const res = await chat.mutateAsync({ message, history });
      setTurns((t) => [...t, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setTurns((t) => [
        ...t,
        { role: 'assistant', content: `Sorry — ${(err as Error).message}` },
      ]);
    }
  };

  return (
    <>
      {!aiChatOpen && (
        <button
          type="button"
          onClick={toggleAiChat}
          className="fixed bottom-5 right-5 z-40 lg:bottom-8 lg:right-8 grid h-[52px] w-[52px] place-items-center rounded-[20px] text-white shadow-level-2 hover:scale-[1.05] active:scale-95 transition-all duration-[300ms] ease-bouncy"
          style={{ background: 'linear-gradient(135deg, #AF52DE 0%, #007AFF 100%)' }}
          aria-label="Open AI assistant"
        >
          <Sparkles size={22} />
        </button>
      )}

      {aiChatOpen && (
        <div 
          className="fixed bottom-5 right-5 z-40 lg:bottom-8 lg:right-8 flex h-[32rem] max-h-[85vh] w-[calc(100vw-40px)] sm:w-[380px] flex-col overflow-hidden rounded-[24px] shadow-glass"
          style={{ 
            background: 'var(--glass-bg-strong)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--separator)' }}>
            <p className="flex items-center gap-2 text-[15px] font-semibold text-label-primary tracking-tight">
              <span className="text-apple-purple"><Sparkles size={16} /></span>
              AI Assistant
            </p>
            <button 
              type="button" 
              onClick={toggleAiChat} 
              className="grid h-7 w-7 place-items-center rounded-full bg-black/[0.06] dark:bg-white/[0.08] text-label-secondary hover:bg-black/10 transition-colors" 
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {!turns.length && (
              <p className="text-center text-[13px] text-label-tertiary pt-10 px-4 leading-relaxed">
                I'm your AI coding assistant. Ask me to explain code, debug an error, or help write a query.
              </p>
            )}
            {turns.map((t, i) => (
              <div
                key={i}
                className={[
                  'max-w-[85%] whitespace-pre-wrap rounded-[18px] px-4 py-2.5 text-[14px] leading-relaxed',
                  t.role === 'user' 
                    ? 'ml-auto bg-apple-blue text-white rounded-br-[4px]' 
                    : 'bg-white dark:bg-[#2C2C2E] text-label-primary shadow-sm rounded-bl-[4px]',
                ].join(' ')}
              >
                {t.content}
              </div>
            ))}
            {chat.isPending && (
              <div className="max-w-[85%] rounded-[18px] rounded-bl-[4px] px-4 py-3 bg-white dark:bg-[#2C2C2E] shadow-sm flex items-center gap-1.5 w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-label-tertiary animate-dot-bounce-1" />
                <span className="h-1.5 w-1.5 rounded-full bg-label-tertiary animate-dot-bounce-2" />
                <span className="h-1.5 w-1.5 rounded-full bg-label-tertiary animate-dot-bounce-3" />
              </div>
            )}
          </div>

          <div className="p-4" style={{ borderTop: '1px solid var(--separator)' }}>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => { e.preventDefault(); void send(); }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="h-10 flex-1 rounded-pill bg-black/[0.03] dark:bg-white/[0.06] px-4 text-[14px] text-label-primary placeholder:text-label-tertiary focus:outline-none focus:bg-black/[0.05] dark:focus:bg-white/[0.08] transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || chat.isPending}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-apple-blue text-white disabled:opacity-50 disabled:pointer-events-none hover:brightness-110 active:scale-95 transition-all"
              >
                <Send size={16} className="-ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
