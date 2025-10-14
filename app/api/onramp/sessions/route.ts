import { NextResponse } from "next/server"
import { onRampSessionDb } from "@/lib/db/mock-db"

export async function GET() {
  try {
    const sessions = await onRampSessionDb.list(50)
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("[v0] List sessions error:", error)
    return NextResponse.json({ error: "Failed to list sessions" }, { status: 500 })
  }
}
