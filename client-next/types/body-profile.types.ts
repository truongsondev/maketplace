export interface BodyProfile {
  age: number | null;
  birthday: string | null;
  heightCm: number | null;
  weightKg: number | null;
  isComplete: boolean;
  updatedAt: string | null;
}

export interface UpdateBodyProfilePayload {
  age?: number;
  birthday?: string | null;
  heightCm?: number;
  weightKg?: number;
}
