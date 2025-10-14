import { type NextRequest, NextResponse } from "next/server"
import { offRampRequestDb } from "@/lib/db/mock-db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const offRampRequest = await offRampRequestDb.findById(params.id)

    if (!offRampRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json(offRampRequest)
  } catch (error) {
    console.error("[v0] Get request error:", error)
    return NextResponse.json({ error: "Failed to get request" }, { status: 500 })
  }
}
