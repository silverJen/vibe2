'use client'

import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface MarkdownMessageProps {
  content: string
  className?: string
}

/**
 * 마크다운 형식의 메시지를 렌더링하는 컴포넌트
 */
export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        components={{
          // 코드 블록 스타일링
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            return match ? (
              <code className={cn('bg-muted rounded px-1.5 py-0.5 text-xs font-mono', className)} {...props}>
                {children}
              </code>
            ) : (
              <code className={cn('bg-muted rounded px-1.5 py-0.5 text-xs font-mono', className)} {...props}>
                {children}
              </code>
            )
          },
          // 인라인 코드 스타일링
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          // 리스트 스타일링
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          // 링크 스타일링
          a: ({ href, children }) => (
            <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // 강조 스타일링
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          // 제목 스타일링
          h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
          // 구분선
          hr: () => <hr className="my-4 border-border" />,
          // 인용구
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
