interface MarkdownTextProps {
  text: string;
  className?: string;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMarkdown(text: string) {
  if (!text.trim()) return '';

  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^- (.+)$/gm, '<div class="markdown-list-item">• $1</div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div class="markdown-list-item">$1. $2</div>')
    .replace(/\n/g, '<br />');
}

export default function MarkdownText({ text, className = '' }: MarkdownTextProps) {
  return (
    <div
      className={`markdown-text ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  );
}
