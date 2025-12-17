import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { getDataPath } from "../exams/utils";

export async function GET() {
  const checks = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      dataDirectory: false,
      manifestFile: false,
    },
  };

  try {
    // Check data directory exists
    const dataDir = getDataPath();
    await fs.access(dataDir);
    checks.checks.dataDirectory = true;

    // Check manifest file exists and is valid JSON
    const manifestPath = getDataPath("manifest.json");
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    JSON.parse(manifestContent);
    checks.checks.manifestFile = true;

    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    checks.status = "unhealthy";
    return NextResponse.json(
      {
        ...checks,
        error: String(error),
      },
      { status: 503 },
    );
  }
}

export const dynamic = "force-dynamic";
