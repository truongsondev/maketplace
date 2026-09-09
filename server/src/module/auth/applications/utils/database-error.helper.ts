/**
 * Helper functions for handling database errors in auth module
 */

/**
 * Check if error is a MySQL duplicate entry error
 * @param error - Error object from database operation
 * @returns true if error is a duplicate entry error
 */
export function isDuplicateEmailError(error: any): boolean {
  const prismaTarget = Array.isArray(error?.meta?.target)
    ? error.meta.target.join(',')
    : String(error?.meta?.target ?? '');

  // MySQL duplicate entry error code
  return (
    // Prisma unique constraint error
    error?.code === 'P2002' ||
    prismaTarget.includes('email') ||
    prismaTarget.includes('users_email_key') ||
    (typeof error?.message === 'string' &&
      (error.message.includes('users_email_key') ||
        error.message.includes('Unique constraint failed') ||
        error.message.includes('email'))) ||
    error.code === 'ER_DUP_ENTRY' ||
    error.code === 23000 ||
    (error.message && error.message.includes('Duplicate entry'))
  );
}

/**
 * Check if error is a MySQL foreign key constraint error
 * @param error - Error object from database operation
 * @returns true if error is a foreign key constraint error
 */
export function isForeignKeyError(error: any): boolean {
  return (
    error.code === 'ER_NO_REFERENCED_ROW' ||
    error.code === 'ER_NO_REFERENCED_ROW_2' ||
    error.code === 1452
  );
}

/**
 * Check if error is a record not found error (Prisma)
 * @param error - Error object from database operation
 * @returns true if error is a record not found error
 */
export function isRecordNotFoundError(error: any): boolean {
  return error.code === 'P2025';
}
