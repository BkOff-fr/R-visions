import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import type { ExamManifest } from "../route";

type Params = {
  params: {
    id: string;
  };
};

const manifestPath = path.join(process.cwd(), "data", "manifest.json");

async function readManifest(): Promise<ExamManifest[]> {
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
    const manifest = await readManifest();
    const exam = manifest.find((item) => item.id === params.id);

    if (!exam) {
      return NextResponse.json(
        { error: "Examen introuvable." },
        { status: 404 },
      );
    }

    const fallbackFile = path.join("data", `${params.id}.json`);
    const targetFile = exam.file ?? fallbackFile;
    const filePath = resolveWithinProject(targetFile);
    const questionsRaw = await fs.readFile(filePath, "utf-8");
    const questions = JSON.parse(questionsRaw);

    return NextResponse.json({ exam, questions });
  } catch (error) {
    console.error("Failed to load exam data", error);
    return NextResponse.json(
      { error: "Impossible de charger les données de l'examen." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";

