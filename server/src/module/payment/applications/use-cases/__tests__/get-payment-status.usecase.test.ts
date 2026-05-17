import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundError } from '@/error-handlling/notFoundError';
import { GetPaymentStatusUseCase } from '../get-payment-status.usecase';
import type { IPaymentRepository } from '../../ports/output/payment.repository';

describe('GetPaymentStatusUseCase ownership', () => {
  it('looks up payment status with the current user id', async () => {
    const repository = {
      findByOrderCodeForUser: jest.fn(async () => null),
    } as Partial<IPaymentRepository> as IPaymentRepository;
    const useCase = new GetPaymentStatusUseCase(repository);

    await expect(useCase.execute('20260001', 'user-2')).rejects.toBeInstanceOf(NotFoundError);

    expect(repository.findByOrderCodeForUser).toHaveBeenCalledWith('20260001', 'user-2');
  });
});
