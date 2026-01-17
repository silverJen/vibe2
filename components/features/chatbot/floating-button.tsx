'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatbotDialog } from './chatbot-dialog'

/**
 * 전역 플로팅 버튼 컴포넌트
 * 화면 하단 오른쪽에 고정되어 챗봇 다이얼로그를 엽니다.
 */
export function FloatingButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        aria-label="물먹는도우미 챗봇 열기"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
      <ChatbotDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}
