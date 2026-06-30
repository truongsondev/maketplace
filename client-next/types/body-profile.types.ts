export interface BodyProfile {
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  isComplete: boolean;
  updatedAt: string | null;
}

export interface UpdateBodyProfilePayload {
  age: number;
  heightCm: number;
  weightKg: number;
}
