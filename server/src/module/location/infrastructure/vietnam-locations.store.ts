import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface VietnamWard {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  short_codename?: string;
}

export interface VietnamProvince {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  phone_code?: number;
  wards: VietnamWard[];
}

let cached: VietnamProvince[] | null = null;

function getCandidatePaths(): string[] {
  const cwd = process.cwd();

  return [
    // Development and existing local runtime.
    join(cwd, 'src', 'resources', 'vietnam-locations', 'nested-divisions.json'),
    // Production Docker runtime (copied as /app/resources).
    join(cwd, 'resources', 'vietnam-locations', 'nested-divisions.json'),
    // Optional fallback if resources are copied under dist.
    join(cwd, 'dist', 'resources', 'vietnam-locations', 'nested-divisions.json'),
  ];
}

async function resolveDataPath(): Promise<string> {
  const candidates = getCandidatePaths();

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue trying the next candidate path.
    }
  }

  throw new Error(`Vietnam locations data file not found. Checked paths: ${candidates.join(', ')}`);
}

export async function loadVietnamLocations(): Promise<VietnamProvince[]> {
  if (cached) return cached;

  const dataPath = await resolveDataPath();
  const raw = await readFile(dataPath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('Invalid vietnam locations json: expected array');
  }

  cached = parsed as VietnamProvince[];
  return cached;
}
