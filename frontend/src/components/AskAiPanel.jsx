import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import axios from "axios";
import { toast } from "react-toastify";
import { X, Send, Bot, Loader2 } from "lucide-react";

const AskAiPanel = ({ isOpen, onClose, getCodeContext }) => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage = prompt.trim();
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const codeContext = getCodeContext ? getCodeContext() : "";

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/ai`,
        {
          prompt: userMessage,
          code: codeContext,
        },
      );

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.data.response },
        ]);
      } else {
        toast.error("Failed to get AI response");
      }
    } catch (error) {
      console.error("AI Error:", error);
      toast.error(
        error.response?.data?.message || "Error communicating with AI",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-96 flex flex-col rounded-lg border border-zinc-700 bg-zinc-900 text-white h-full shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-800/50">
        <div className="flex items-center gap-2 font-semibold">
          <Bot className="w-5 h-5 text-indigo-400" />
          Ask AI
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Response Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-zinc-950/50 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4 text-center">
            <div className="bg-zinc-800/50 p-4 rounded-full">
              <Bot className="w-10 h-10 text-zinc-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-300">How can I help?</p>
              <p className="text-xs mt-2 px-4">
                Ask me to explain code, find bugs, generate boilerplate, or
                suggest optimizations. I will automatically see the file you are
                currently working on.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`flex items-center gap-2 text-xs mb-1 ${msg.role === "user" ? "text-indigo-300" : "text-zinc-400"}`}
              >
                {msg.role === "user" ? "You" : "CodeFusion AI"}
              </div>
              <div
                className={`max-w-[90%] rounded-lg px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-tl-none"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="whitespace-pre-wrap text-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none prose-p:leading-snug prose-p:my-1 prose-pre:my-2 prose-pre:bg-zinc-950/50">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <SyntaxHighlighter
                              {...props}
                              children={String(children).replace(/\n$/, "")}
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-md my-2"
                            />
                          ) : (
                            <code
                              {...props}
                              className={`${className} bg-zinc-800 px-1 py-0.5 rounded text-indigo-300 font-mono text-xs`}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 text-xs mb-1 text-zinc-400">
              CodeFusion AI
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg rounded-tl-none px-4 py-3 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="text-sm text-zinc-400 animate-pulse">
                Thinking...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-zinc-700 bg-zinc-900">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="relative">
            <textarea
              value={prompt || ""}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 pr-10 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none h-auto min-h-11 max-h-32 placeholder-zinc-500"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-md transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-zinc-500 text-center">
            Shift + Enter for new line. Includes current code context
            automatically.
          </div>
        </form>
      </div>
    </div>
  );
};

export default AskAiPanel;
