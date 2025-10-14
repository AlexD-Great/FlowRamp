import { NextResponse } from "next/server"
import { offRampRequestDb } from "@/lib/db/mock-db"

export async function GET() {
  try {
    const requests = await offRampRequestDb.list(50)
    return NextResponse.json({ requests })
  } catch (error) {
    console.error("[v0] List requests error:", error)
    return NextResponse.json({ error: "Failed to list requests" }, { status: 500 })
  }
}
