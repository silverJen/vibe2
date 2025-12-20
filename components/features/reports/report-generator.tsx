"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { generateAIReport } from "@/lib/actions/reports"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    setIsGenerating(true)

    // 기본적으로 최근 7일 리포트 생성
    const result = await generateAIReport()

    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.error || 'AI 리포트 생성에 실패했습니다.')
    }

    setIsGenerating(false)
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-water/10 to-background border-water/20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-water" />
            <h2 className="text-xl font-semibold">새 리포트 생성</h2>
          </div>
          <p className="text-muted-foreground">최근 7일간의 물 섭취 패턴을 AI가 분석해드립니다</p>
        </div>
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-water hover:bg-water/90 text-white"
        >
          {isGenerating ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              리포트 생성
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
