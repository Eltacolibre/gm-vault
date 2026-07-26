import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function Markdown({ text }: { text: string }) {
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(text, { async: false }) as string),
    [text]
  );
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}
