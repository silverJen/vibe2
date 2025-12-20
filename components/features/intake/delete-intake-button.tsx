"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteWaterRecord } from "@/lib/actions/water"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"

export function DeleteIntakeButton({ id }: { id: string }) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm("정말 삭제하시겠습니까?")) return

        setIsDeleting(true)
        const result = await deleteWaterRecord(id)

        if (result.success) {
            toast.success("기록을 삭제했습니다.")
            router.refresh()
        } else {
            toast.error(result.error || "삭제 실패")
        }
        setIsDeleting(false)
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="hover:text-destructive"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}
