import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
        // 코드 블록 스타일링
        code: ({ className, children, ...props }) => {
          const isInline = !className
          return isInline ? (
            <code
              className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          ) : (
            <code
              className={`block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto ${className}`}
              {...props}
            >
              {children}
            </code>
          )
        },
        // 링크 스타일링
        a: ({ children, ...props }) => (
          <a
            className="text-blue-600 dark:text-blue-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        ),
        // 강조 텍스트
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
        ),
        // 이탤릭
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        // 리스트
        ul: ({ children }) => (
          <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
        ),
        // 블록쿼트
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 italic text-gray-600 dark:text-gray-400">
            {children}
          </blockquote>
        ),
        // 단락
        p: ({ children }) => (
          <p className="my-2 leading-relaxed">{children}</p>
        ),
        // 헤딩
        h1: ({ children }) => (
          <h1 className="text-xl font-bold my-3">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold my-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-bold my-2">{children}</h3>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
