import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export type ExamManifest = {
  id: string;
  subject: string;
  code: string;
  type: string;
  year: number;
  title: string;
  description: string;
  file?: string;
  resources?: Record<string, string>;
};

const manifestPath = path.join(process.cwd(), "data", "manifest.json");

async function readManifest(): Promise<ExamManifest[]> {
  const file = await fs.readFile(manifestPath, "utf-8");
  return JSON.parse(file);
}

export async function GET() {
  try {
    const manifest = await readManifest();
    return NextResponse.json(manifest);
  } catch (error) {
    console.error("Failed to load manifest", error);
    return NextResponse.json(
      { error: "Impossible de charger le manifeste des examens." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";

