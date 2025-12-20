"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Heart } from "lucide-react"
import { useState, useEffect } from "react"
import { createConditionRecord, getTodayConditionRecord, updateConditionRecord } from "@/lib/actions/conditions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const CONDITION_OPTIONS = [
    { value: 'fatigue', label: '피로' },
    { value: 'swelling', label: '붓기' },
    { value: 'headache', label: '두통' },
    { value: 'dry_skin', label: '피부 건조' },
    { value: 'good', label: '좋음' },
]

export function ConditionPrompt() {
    const [selectedConditions, setSelectedConditions] = useState<string[]>([])
    const [note, setNote] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [existingRecord, setExistingRecord] = useState<any>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        loadTodayCondition()
    }, [])

    const loadTodayCondition = async () => {
        setIsLoading(true)
        const result = await getTodayConditionRecord()
        if (result.success && result.data) {
            setExistingRecord(result.data)
            setSelectedConditions(result.data.conditions)
            setNote(result.data.note || '')
            // 이미 기록이 있으면 접어둘지 펼쳐둘지? -> 기록했으면 보여준다 (수정 가능하게)
            // 여기서는 일단 접어두고 '오늘의 컨디션: 좋음' 등으로 요약 표시하는게 좋겠지만
            // 간단하게 구현하기 위해, 기록이 없으면 펼치고(유도), 있으면 접어둠
            setIsExpanded(false)
        } else {
            // 기록 없으면 펼치지 않음 (사용자가 원할 때 누르도록)
            // 또는 처음엔 닫혀있고 '기록하기' 버튼 노출
            setIsExpanded(false)
        }
        setIsLoading(false)
    }

    const handleToggleCondition = (value: string) => {
        setSelectedConditions(prev =>
            prev.includes(value)
                ? prev.filter(c => c !== value)
                : [...prev, value]
        )
    }

    const handleSubmit = async () => {
        if (selectedConditions.length === 0) {
            toast.error('컨디션을 하나 이상 선택해주세요')
            return
        }

        setIsSubmitting(true)

        const result = existingRecord
            ? await updateConditionRecord(existingRecord.id, selectedConditions, note)
            : await createConditionRecord(selectedConditions, note)

        if (result.success) {
            toast.success(result.message)
            router.refresh()
            setExistingRecord(result.data) // 업데이트된 데이터로 갱신
            setIsExpanded(false) // 저장 후 닫기
        } else {
            toast.error(result.error || '컨디션 기록에 실패했습니다')
        }

        setIsSubmitting(false)
    }

    if (isLoading) {
        return null // 로딩 중 깜빡임 방지용 스켈레톤 대신 숨김
    }

    if (!isExpanded) {
        return (
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setIsExpanded(true)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Heart className={`h-4 w-4 ${existingRecord ? 'fill-purple-600 text-purple-600' : 'text-purple-600'}`} />
                        <span className="text-sm font-medium text-purple-900">
                            {existingRecord ? '오늘의 컨디션 기록됨' : '오늘 컨디션은 어떠세요?'}
                        </span>
                    </div>
                    <span className="text-xs text-purple-600 font-medium">
                        {existingRecord ? '수정하기' : '기록하기'}
                    </span>
                </div>
                {existingRecord && (
                    <div className="mt-2 text-xs text-purple-700 flex gap-1 flex-wrap">
                        {existingRecord.conditions.map((c: string) => (
                            <span key={c} className="bg-white/50 px-1.5 py-0.5 rounded">
                                {CONDITION_OPTIONS.find(o => o.value === c)?.label || c}
                            </span>
                        ))}
                    </div>
                )}
            </Card>
        )
    }

    return (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-purple-900">오늘의 컨디션</h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(false);
                        }}
                        className="text-purple-700 hover:text-purple-900 hover:bg-purple-100"
                    >
                        닫기
                    </Button>
                </div>

                <div className="space-y-3">
                    <p className="text-sm text-purple-800">어떤 상태인가요?</p>
                    <div className="grid grid-cols-2 gap-3">
                        {CONDITION_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                    id={option.value}
                                    checked={selectedConditions.includes(option.value)}
                                    onCheckedChange={() => handleToggleCondition(option.value)}
                                    className="border-purple-300 data-[state=checked]:bg-purple-600 data-[state=checked]:text-white"
                                />
                                <label
                                    htmlFor={option.value}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-purple-900 cursor-pointer"
                                >
                                    {option.label}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm text-purple-800">추가 메모 (선택)</p>
                    <Textarea
                        placeholder="오늘 특별히 느낀 점이 있나요?"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        className="bg-white/50 border-purple-200 focus-visible:ring-purple-400"
                    />
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || selectedConditions.length === 0}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                    {isSubmitting ? '저장 중...' : existingRecord ? '수정하기' : '저장하기'}
                </Button>
            </div>
        </Card>
    )
}
