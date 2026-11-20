import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LessonMarkdownProps {
  readonly markdown: string;
  readonly accentHex: string;
}

/** Renders lesson Markdown from the backend (lists, bold, blockquotes and GFM tables). */
export function LessonMarkdown({ markdown, accentHex }: LessonMarkdownProps) {
  const components: Components = {
    h1: ({ children }) => <h3 className="font-heading text-sm font-semibold text-foreground">{children}</h3>,
    h2: ({ children }) => <h3 className="font-heading text-sm font-semibold text-foreground">{children}</h3>,
    h3: ({ children }) => <h3 className="font-heading text-sm font-semibold text-foreground">{children}</h3>,
    h4: ({ children }) => <h4 className="text-sm font-semibold text-foreground">{children}</h4>,
    p: ({ children }) => <p className="leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="ml-4 flex list-disc flex-col gap-1">{children}</ul>,
    ol: ({ children }) => <ol className="ml-4 flex list-decimal flex-col gap-1">{children}</ol>,
    li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    a: ({ children, href }) => (
      <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-4" style={{ color: accentHex }}>
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className="flex flex-col gap-1.5 border-l-2 bg-secondary/40 py-2 pr-2 pl-3"
        style={{ borderColor: accentHex }}
      >
        {children}
      </blockquote>
    ),
    hr: () => <hr className="border-border" />,
    code: ({ children }) => <code className="bg-secondary px-1 py-0.5 text-xs">{children}</code>,
    table: ({ children }) => (
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full border-collapse text-xs">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-border bg-secondary px-2 py-1.5 text-left font-semibold text-foreground">
        {children}
      </th>
    ),
    td: ({ children }) => <td className="border border-border px-2 py-1.5 align-top">{children}</td>,
  };

  return (
    <div className="flex flex-col gap-2.5 text-sm text-foreground/90">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </Markdown>
    </div>
  );
}
