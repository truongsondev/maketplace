import { readFile } from 'node:fs/promises';
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

function getDataPath(): string {
  // server/src/module/location/infrastructure -> server/src/resources/vietnam-locations
  return join(process.cwd(), 'src', 'resources', 'vietnam-locations', 'nested-divisions.json');
}

export async function loadVietnamLocations(): Promise<VietnamProvince[]> {
  if (cached) return cached;

  const raw = await readFile(getDataPath(), 'utf8');
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('Invalid vietnam locations json: expected array');
  }

  cached = parsed as VietnamProvince[];
  return cached;
}
