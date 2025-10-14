import { type NextRequest, NextResponse } from "next/server"
import { onRampSessionDb } from "@/lib/db/mock-db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await onRampSessionDb.findById(params.id)

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("[v0] Get session error:", error)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}
