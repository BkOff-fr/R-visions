import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import type { ExamManifest } from "../route";
import { getDataPath, validatePathSecurity } from "../utils";

type Params = {
  params: {
    id: string;
  };
};

async function readManifest(): Promise<ExamManifest[]> {
  const manifestPath = getDataPath("manifest.json");
  const baseDir = getDataPath();
  validatePathSecurity(manifestPath, baseDir);

  const file = await fs.readFile(manifestPath, "utf-8");
  return JSON.parse(file);
}

function resolveWithinProject(targetPath: string): string {
  const base = process.cwd();
  const absolute = path.isAbsolute(targetPath)
    ? targetPath
    : path.join(base, targetPath);
  const normalized = path.normalize(absolute);

  if (!normalized.startsWith(base)) {
    throw new Error("Chemin de données non autorisé.");
  }
  return normalized;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    // Validate input
    if (!params.id || typeof params.id !== "string" || params.id.length > 50) {
      return NextResponse.json(
        { error: "Invalid exam ID parameter." },
        { status: 400 },
      );
    }

    // Sanitize input (prevent path traversal)
    if (
      params.id.includes("..") ||
      params.id.includes("/") ||
      params.id.includes("\\")
    ) {
      return NextResponse.json(
        { error: "Invalid exam ID format." },
        { status: 400 },
      );
    }

    const manifest = await readManifest();
    const exam = manifest.find((item) => item.id === params.id);

    if (!exam) {
      return NextResponse.json(
        { error: `Exam '${params.id}' not found in catalog.` },
        { status: 404 },
      );
    }

    const fallbackFile = path.join("data", `${params.id}.json`);
    const targetFile = exam.file ?? fallbackFile;
    const filePath = resolveWithinProject(targetFile);

    let questionsRaw: string;
    try {
      questionsRaw = await fs.readFile(filePath, "utf-8");
    } catch (fileError) {
      if ((fileError as NodeJS.ErrnoException).code === "ENOENT") {
        return NextResponse.json(
          { error: `Question file not found: ${exam.file || fallbackFile}` },
          { status: 404 },
        );
      }
      throw fileError;
    }

    let questions: unknown;
    try {
      questions = JSON.parse(questionsRaw);
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON format in question file." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { exam, questions },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Unexpected error loading exam data", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred while loading the exam.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 },
    );
  }
}

export const revalidate = 300;

