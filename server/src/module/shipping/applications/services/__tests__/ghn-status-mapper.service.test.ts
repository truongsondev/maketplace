import { mapGhnStatus } from '../ghn-status-mapper.service';

describe('mapGhnStatus', () => {
  it.each([
    ['delivered', 'DELIVERED'],
    ['delivery_fail', 'DELIVERY_FAILED'],
    ['returned', 'RETURN_TO_STORE'],
    ['return_transporting', 'RETURN_TO_STORE'],
  ])('maps %s to %s', (input, expected) => {
    expect(mapGhnStatus(input)).toBe(expected);
  });

  it.each(['exception', 'damage', 'lost', 'return_fail', 'cancel'])('does not apply unsafe status for %s', status => {
    expect(mapGhnStatus(status)).toBeNull();
  });
});
