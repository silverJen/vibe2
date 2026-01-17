'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { MarkdownMessage } from './markdown-message'
import { chatWithAssistant } from '@/lib/actions/chatbot'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatbotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 물먹는도우미 챗봇 다이얼로그 컴포넌트
 */
export function ChatbotDialog({ open, onOpenChange }: ChatbotDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 스크롤을 맨 아래로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (open) {
      scrollToBottom()
    }
  }, [messages, open])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    // 사용자 메시지 추가
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // 챗봇 응답 요청
      const response = await chatWithAssistant(userMessage.content)

      if (response.success && response.answer) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        // 에러 메시지 표시
        const errorMessage: Message = {
          role: 'assistant',
          content: `죄송합니다. 오류가 발생했습니다: ${response.error || '알 수 없는 오류'}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>물먹는도우미</DialogTitle>
          <DialogDescription>
            물 섭취와 수분 관리에 대해 질문해주세요. 지식 기반에서 답변을 찾아드립니다.
          </DialogDescription>
        </DialogHeader>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-[300px] max-h-[500px]">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              안녕하세요! 물 섭취와 수분 관리에 대해 무엇이든 물어보세요.
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.role === 'assistant' ? (
                  <MarkdownMessage content={message.content} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Spinner />
                  <span>답변을 생성하고 있습니다...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="flex gap-2 border-t pt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="질문을 입력하세요..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
