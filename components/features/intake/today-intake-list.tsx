import { Card } from "@/components/ui/card"
import { Droplets } from "lucide-react"
import { getTodayWaterRecords } from "@/lib/actions/water"
import { DeleteIntakeButton } from "./delete-intake-button"
import { format } from "date-fns"

export async function TodayIntakeList() {
  const { data: records } = await getTodayWaterRecords()

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "high": return "마셨음"
      case "medium": return "조금 마셨음"
      case "low": return "거의 안 마셨음"
      default: return level
    }
  }

  const getLevelColorClass = (level: string) => {
    switch (level) {
      case "high": return "text-water"
      case "medium": return "text-water/60"
      case "low": return "text-water/30"
      default: return "text-muted-foreground"
    }
  }

  if (!records || records.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground py-8">
          <Droplets className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>아직 기록이 없어요</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">오늘의 기록</h3>
      <div className="space-y-3">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Droplets
                className={`h-5 w-5 ${getLevelColorClass(record.intake_level)}`}
              />
              <div>
                <div className="font-medium">{getLevelLabel(record.intake_level)}</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(record.recorded_at), "HH:mm")}
                </div>
              </div>
            </div>
            <DeleteIntakeButton id={record.id} />
          </div>
        ))}
      </div>
    </Card>
  )
}
