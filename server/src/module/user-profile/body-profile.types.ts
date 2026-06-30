export interface BodyProfileResult {
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  isComplete: boolean;
  updatedAt: Date | null;
}

export interface UpdateBodyProfileCommand {
  userId: string;
  age: number;
  heightCm: number;
  weightKg: number;
}

export function toBodyProfileResult(user: {
  age: number | null;
  heightCm: unknown;
  weightKg: unknown;
  bodyProfileUpdatedAt: Date | null;
}): BodyProfileResult {
  const heightCm = user.heightCm === null ? null : Number(user.heightCm);
  const weightKg = user.weightKg === null ? null : Number(user.weightKg);

  return {
    age: user.age,
    heightCm,
    weightKg,
    isComplete: user.age !== null && heightCm !== null && weightKg !== null,
    updatedAt: user.bodyProfileUpdatedAt,
  };
}
