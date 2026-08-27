import { formatPostDate } from './posts.controller';

describe('formatPostDate', () => {
  it('formats a UTC timestamp without using the process timezone', () => {
    expect(formatPostDate(new Date('2024-01-15T12:00:00.000Z'))).toBe(
      'Jan 15, 2024, 12:00 PM',
    );
  });
});
