import { getAIReports } from "@/lib/actions/reports"
import { Card } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export async function ReportList() {
  const result = await getAIReports()
  const reports = result.data || []

  if (reports.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>아직 생성된 리포트가 없어요</p>
          <p className="text-sm mt-1">위에서 첫 번째 리포트를 생성해보세요!</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">최근 리포트</h3>
      {reports.map((report) => (
        <Card key={report.id} className="p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-water/10">
              <FileText className="h-5 w-5 text-water" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">
                    {format(new Date(report.start_date), 'M월 d일', { locale: ko })} ~{' '}
                    {format(new Date(report.end_date), 'M월 d일', { locale: ko })} 리포트
                  </h4>
                </div>
                <span className="text-xs bg-water/10 text-water px-2 py-1 rounded">
                  {report.report_type === 'weekly' ? '주간' : '맞춤'}
                </span>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{report.content}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                생성일: {format(new Date(report.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
