"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Droplets } from "lucide-react"
import { useState } from "react"
import { createWaterRecord } from "@/lib/actions/water"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type IntakeLevel = "high" | "medium" | "low"

export function IntakeRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const router = useRouter()

  const handleRecord = async (level: IntakeLevel) => {
    setIsRecording(true)

    const result = await createWaterRecord(level)

    if (result.success) {
      toast.success("물 섭취를 기록했습니다! 💧")
      router.refresh()
    } else {
      toast.error(result.error || "기록에 실패했습니다.")
    }

    setIsRecording(false)
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-water" />
          <h2 className="text-xl font-semibold">물 섭취 기록</h2>
        </div>

        <div className="grid gap-3">
          <Button
            size="lg"
            className="h-14 bg-water hover:bg-water/90 text-white"
            onClick={() => handleRecord("high")}
            disabled={isRecording}
          >
            <Droplets className="mr-2 h-5 w-5" />
            마셨음
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-14 border-water/30 text-water hover:bg-water/10 bg-transparent"
            onClick={() => handleRecord("medium")}
            disabled={isRecording}
          >
            <Droplets className="mr-2 h-4 w-4" />
            조금 마셨음
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-14 bg-transparent"
            onClick={() => handleRecord("low")}
            disabled={isRecording}
          >
            <Droplets className="mr-2 h-3 w-3" />
            거의 안 마셨음
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">버튼을 눌러 간편하게 기록하세요</p>
      </div>
    </Card>
  )
}
