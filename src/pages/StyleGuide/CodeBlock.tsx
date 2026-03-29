import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  children: string;
}

export function CodeBlock({ children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-4 rounded-xl overflow-hidden" style={{ background: 'var(--sg-navy)' }}>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors"
        style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(247,244,240,0.7)' }}
        aria-label="Copy code"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre className="p-4 text-sm overflow-x-auto" style={{ color: '#F7F4F0', fontFamily: 'monospace' }}>
        <code>{children}</code>
      </pre>
    </div>
  );
}
