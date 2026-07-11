import { GhnAddressResolverService, normalizeAdministrativeName } from '../ghn-address-resolver.service';
import type { GhnClient } from '../../../infrastructure/ghn/ghn.client';
import { jest } from '@jest/globals';

describe('GhnAddressResolverService', () => {
  it.each([
    ['Thành phố Hồ Chí Minh', 'Hồ Chí Minh'],
    ['Quận 1', '1'],
    ['Phường Bến Nghé', 'ben nghe'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeAdministrativeName(input)).toBe(normalizeAdministrativeName(expected));
  });

  it('resolves each administrative level inside its parent', async () => {
    const client = {
      provinces: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([{ ProvinceID: 202, ProvinceName: 'Hồ Chí Minh' }]),
      districts: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([{ DistrictID: 1442, DistrictName: 'Quận 1' }]),
      wards: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([{ WardCode: '20101', WardName: 'Phường Bến Nghé' }]),
    } as unknown as GhnClient;
    const resolver = new GhnAddressResolverService(client);

    await expect(resolver.resolve({ city: 'Thành phố Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Nghé' }))
      .resolves.toEqual({ provinceId: 202, districtId: 1442, wardCode: '20101' });
    expect(client.districts).toHaveBeenCalledWith(202);
    expect(client.wards).toHaveBeenCalledWith(1442);
  });

  it('fails clearly instead of choosing a partial match', async () => {
    const client = { provinces: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]) } as unknown as GhnClient;
    await expect(new GhnAddressResolverService(client).resolve({ city: 'Unknown', district: 'D', ward: 'W' }))
      .rejects.toThrow('Không thể xác định tỉnh/thành phố GHN');
  });
});
