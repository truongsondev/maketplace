import { BadRequestError } from '../../error-handlling/badRequestError';

export function validateBodyProfileInput(input: {
  age: unknown;
  heightCm: unknown;
  weightKg: unknown;
}): { age: number; heightCm: number; weightKg: number } {
  const age = Number(input.age);
  const heightCm = Number(input.heightCm);
  const weightKg = Number(input.weightKg);

  if (!Number.isInteger(age) || age < 13 || age > 100) {
    throw new BadRequestError('Tuổi phải là số nguyên từ 13 đến 100.', 'INVALID_BODY_PROFILE');
  }

  if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 230) {
    throw new BadRequestError(
      'Chiều cao phải nằm trong khoảng 100cm đến 230cm.',
      'INVALID_BODY_PROFILE',
    );
  }

  if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 250) {
    throw new BadRequestError(
      'Cân nặng phải nằm trong khoảng 30kg đến 250kg.',
      'INVALID_BODY_PROFILE',
    );
  }

  return {
    age,
    heightCm: Math.round(heightCm * 100) / 100,
    weightKg: Math.round(weightKg * 100) / 100,
  };
}
