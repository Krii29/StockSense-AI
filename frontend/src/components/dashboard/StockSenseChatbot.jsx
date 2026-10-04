import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  ChevronDown,
  Send,
  Sparkles,
  X,
  User,
} from 'lucide-react';
import { sendChatMessage } from '../../services/api';

export default function StockSenseChatbot({
  symbol = 'RELIANCE',
  market = 'NSE',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: `Hi! 👋 I'm StockSense AI.\n\nYou're currently viewing ${symbol} on ${market}.\n\nAsk me about the current price, AI prediction, news sentiment, or a complete stock analysis.`,
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, loading]);

  useEffect(() => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        text: `You're now viewing ${symbol} on ${market}. 📊\n\nAsk me anything about this stock.`,
      },
    ]);
  }, [symbol, market]);

  const suggestions = [
    'Analyze this stock',
    'What is the prediction?',
    'Check news sentiment',
  ];

  const handleSend = async (text = message) => {
    const trimmedMessage = text.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmedMessage,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setMessage('');
    setLoading(true);

    try {
      const response = await sendChatMessage(
        trimmedMessage,
        symbol,
        market
      );

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text:
            response.reply ||
            'I could not generate a response right now.',
        },
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text:
            'I could not connect to the StockSense AI service right now. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating chatbot button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl border border-cyan-400/30 bg-[#0b1422]/95 px-4 py-3 text-white shadow-[0_10px_40px_rgba(0,0,0,0.45),0_0_30px_rgba(6,182,212,0.12)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-cyan-500/20"
        >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20">
            <Bot className="h-5 w-5" />

            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0b1422] bg-emerald-400" />
          </span>

          <span className="hidden text-left sm:block">
            <span className="block text-xs font-medium text-cyan-400">
              AI ASSISTANT
            </span>

            <span className="block text-sm font-semibold">
              Ask StockSense AI
            </span>
          </span>

          <Sparkles className="hidden h-4 w-4 text-purple-400 sm:block" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[100] flex h-[650px] w-[calc(100vw-32px)] max-w-[430px] flex-col overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#08111e]/98 shadow-[0_30px_100px_rgba(0,0,0,0.65),0_0_50px_rgba(6,182,212,0.08)] backdrop-blur-2xl">
          {/* Header */}
          <div className="relative overflow-hidden border-b border-slate-700/60 px-5 py-4">
            <div className="pointer-events-none absolute -right-12 -top-20 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20">
                  <Bot className="h-5 w-5" />

                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#08111e] bg-emerald-400" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white">
                      StockSense AI
                    </h3>

                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  </div>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {symbol} · {market}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800/70 hover:text-white"
                  aria-label="Minimize chatbot"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800/70 hover:text-white"
                  aria-label="Close chatbot"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Stock context */}
          <div className="border-b border-slate-800/70 bg-cyan-400/[0.025] px-5 py-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />

              <span className="text-slate-500">
                Context:
              </span>

              <span className="font-semibold text-cyan-300">
                {symbol}
              </span>

              <span className="text-slate-600">
                •
              </span>

              <span className="text-slate-400">
                {market}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            <div className="space-y-4">
              {messages.map((item) => {
                const isUser = item.role === 'user';

                return (
                  <div
                    key={item.id}
                    className={`flex gap-2.5 ${
                      isUser
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    {!isUser && (
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${
                        isUser
                          ? 'rounded-br-md bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/10'
                          : 'rounded-bl-md border border-slate-700/70 bg-[#0d1929] text-slate-300'
                      }`}
                    >
                      {item.text}
                    </div>

                    {isUser && (
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
                    <Bot className="h-4 w-4" />
                  </div>

                  <div className="rounded-2xl rounded-bl-md border border-slate-700/70 bg-[#0d1929] px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Suggestions */}
          <div className="border-t border-slate-800/70 px-4 pt-3">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSend(suggestion)}
                  className="shrink-0 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-[#050b14] p-1.5 transition focus-within:border-cyan-400/40 focus-within:ring-4 focus-within:ring-cyan-400/5">
              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder={`Ask about ${symbol}...`}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!message.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 transition hover:from-cyan-300 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-slate-600">
              AI-generated insights • Not financial advice
            </p>
          </div>
        </div>
      )}
    </>
  );
}