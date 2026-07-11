import { BadRequestError } from '../../error-handlling/badRequestError';

export function validateBodyProfileInput(input: {
  age?: unknown;
  birthday?: unknown;
  heightCm?: unknown;
  weightKg?: unknown;
}): { age?: number; birthday?: Date | null; heightCm?: number; weightKg?: number } {
  let birthday: Date | null | undefined;
  let age: number | undefined;
  let heightCm: number | undefined;
  let weightKg: number | undefined;

  if (input.age !== undefined) {
    const parsedAge = Number(input.age);
    if (!Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 100) {
      throw new BadRequestError('Tuổi phải là số nguyên từ 13 đến 100.', 'INVALID_BODY_PROFILE');
    }
    age = parsedAge;
  }

  if (input.heightCm !== undefined) {
    const parsedHeightCm = Number(input.heightCm);
    if (!Number.isFinite(parsedHeightCm) || parsedHeightCm < 100 || parsedHeightCm > 230) {
      throw new BadRequestError(
        'Chiều cao phải nằm trong khoảng 100cm đến 230cm.',
        'INVALID_BODY_PROFILE',
      );
    }
    heightCm = Math.round(parsedHeightCm * 100) / 100;
  }

  if (input.weightKg !== undefined) {
    const parsedWeightKg = Number(input.weightKg);
    if (!Number.isFinite(parsedWeightKg) || parsedWeightKg < 30 || parsedWeightKg > 250) {
      throw new BadRequestError(
        'Cân nặng phải nằm trong khoảng 30kg đến 250kg.',
        'INVALID_BODY_PROFILE',
      );
    }
    weightKg = Math.round(parsedWeightKg * 100) / 100;
  }

  if (input.birthday === null || input.birthday === '') {
    birthday = null;
  } else if (input.birthday !== undefined) {
    if (typeof input.birthday !== 'string') {
      throw new BadRequestError('Ngày sinh không hợp lệ.', 'INVALID_BODY_PROFILE');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthday)) {
      throw new BadRequestError('Ngày sinh phải có định dạng YYYY-MM-DD.', 'INVALID_BODY_PROFILE');
    }
    const [year, month, day] = input.birthday.split('-').map(Number);
    birthday = new Date(`${input.birthday}T00:00:00.000Z`);
    const currentYear = new Date().getUTCFullYear();
    const minimumBirthday = new Date(Date.UTC(currentYear - 100, 0, 1));
    const maximumBirthday = new Date(Date.UTC(currentYear - 13, 11, 31));

    if (
      Number.isNaN(birthday.getTime()) ||
      birthday.getUTCFullYear() !== year ||
      birthday.getUTCMonth() !== month - 1 ||
      birthday.getUTCDate() !== day ||
      birthday < minimumBirthday ||
      birthday > maximumBirthday
    ) {
      throw new BadRequestError('Ngày sinh không hợp lệ.', 'INVALID_BODY_PROFILE');
    }
  }

  if (
    age === undefined &&
    heightCm === undefined &&
    weightKg === undefined &&
    birthday === undefined
  ) {
    throw new BadRequestError('Không có thông tin nào để cập nhật.', 'INVALID_BODY_PROFILE');
  }

  return {
    ...(age !== undefined ? { age } : {}),
    ...(birthday !== undefined ? { birthday } : {}),
    ...(heightCm !== undefined ? { heightCm } : {}),
    ...(weightKg !== undefined ? { weightKg } : {}),
  };
}
