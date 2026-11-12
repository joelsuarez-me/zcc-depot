import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

function safeUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? url : "";
  } catch {
    return url.startsWith("#") ? url : "";
  }
}

const components: Components = {
  h1: ({ children }) => <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#11110D]">{children}</h2>,
  h2: ({ children }) => (
    <h3 className="mt-10 flex items-baseline gap-3 border-t border-[#11110D]/10 pt-6 text-xl font-semibold tracking-tight text-[#203524] first:mt-0 first:border-0 first:pt-0">{children}</h3>
  ),
  h3: ({ children }) => <h4 className="mt-6 text-base font-semibold text-[#11110D]">{children}</h4>,
  h4: ({ children }) => <h5 className="mt-4 text-sm font-semibold uppercase tracking-wide text-[#11110D]/70">{children}</h5>,
  p: ({ children }) => <p className="mt-3 text-[0.95rem] leading-relaxed text-[#11110D]/85">{children}</p>,
  ul: ({ children }) => <ul className="mt-3 space-y-1.5 pl-5 text-[0.95rem] leading-relaxed text-[#11110D]/85 marker:text-[#203524] [list-style:square]">{children}</ul>,
  ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[0.95rem] leading-relaxed text-[#11110D]/85 marker:font-semibold marker:text-[#203524]">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[#11110D]">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="mt-4 rounded-r-xl border-l-2 border-[#203524] bg-[#eef3e1] px-4 py-2 text-[#203524]">{children}</blockquote>,
  code: ({ children }) => <code className="mono rounded bg-[#11110D]/[.06] px-1 py-0.5 text-[0.82em]">{children}</code>,
  hr: () => <hr className="my-6 border-[#11110D]/10" />,
  table: ({ children }) => <div className="mt-4 overflow-x-auto rounded-xl border border-[#11110D]/10"><table className="w-full text-left text-sm">{children}</table></div>,
  th: ({ children }) => <th className="bg-[#203524] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#F5F5F2]">{children}</th>,
  td: ({ children }) => <td className="border-t border-[#11110D]/10 px-3 py-2 align-top text-[#11110D]/85">{children}</td>,
  img: ({ alt }) => (alt ? <span className="text-[#11110D]/60">[image omitted: {alt}]</span> : null),
  a: ({ href, children }) => {
    const url = safeUrl(href ?? "");
    if (!url) return <span>{children}</span>;
    const isCite = typeof children === "string" ? /^\[?\d+\]?$/.test(children.trim()) : Array.isArray(children) && children.length === 1 && /^\[?\d+\]?$/.test(String(children[0]).trim());
    if (isCite) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer nofollow" title={url}
          className="mono mx-0.5 inline-grid min-w-[1.35rem] place-items-center rounded-md bg-[#D1F470]/70 px-1 align-[0.1em] text-[0.68rem] font-semibold text-[#203524] no-underline hover:bg-[#203524] hover:text-[#D1F470]">
          {String(Array.isArray(children) ? children[0] : children).replace(/[[\]]/g, "")}
        </a>
      );
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="break-words font-medium text-[#203524] underline decoration-[#203524]/30 underline-offset-2 hover:decoration-[#203524]">
        {children}
      </a>
    );
  },
};

export const ResearchMarkdown = memo(function ResearchMarkdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={(u) => safeUrl(u)} components={components}>
      {markdown}
    </ReactMarkdown>
  );
});
