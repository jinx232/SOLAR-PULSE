import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchPostalCode } from './postalLookup';

// Reset module cache between tests
beforeEach(() => {
  global.fetch = undefined;
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('searchPostalCode', () => {
  it('maps results from Nominatim correctly', async () => {
    const mockResponse = [
      { display_name: 'Test Place, Testland', lat: '10.5', lon: '-20.25', address: { postcode: '12345' } }
    ];

    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockResponse) }));

    const res = await searchPostalCode('12345');
    expect(global.fetch).toHaveBeenCalled();
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ display_name: 'Test Place, Testland', lat: 10.5, lon: -20.25 });
  });

  it('caches results in localStorage and in-memory', async () => {
    const mockResponse = [ { display_name: 'Place A', lat: '1', lon: '2', address: {} } ];
    const fetchSpy = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockResponse) }));
    global.fetch = fetchSpy;

    // First call - triggers network
    const a = await searchPostalCode('Place A');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(a[0].display_name).toBe('Place A');

    // Second call with same query should be served from cache and not call fetch again
    const b = await searchPostalCode('Place A');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(b[0].display_name).toBe('Place A');
  });

  it('throws network error when fetch fails', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('network failure')));
    await expect(searchPostalCode('x')).rejects.toThrow('Network error during postal lookup');
  });
});
