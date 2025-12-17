import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getDataPath, validatePathSecurity } from "./utils";

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

async function readManifest(): Promise<ExamManifest[]> {
  const manifestPath = getDataPath("manifest.json");
  const baseDir = getDataPath();
  validatePathSecurity(manifestPath, baseDir);

  const file = await fs.readFile(manifestPath, "utf-8");
  return JSON.parse(file);
}

export async function GET() {
  try {
    const manifest = await readManifest();
    return NextResponse.json(manifest, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Failed to load manifest", error);
    return NextResponse.json(
      { error: "Impossible de charger le manifeste des examens." },
      { status: 500 },
    );
  }
}

export const revalidate = 60;

