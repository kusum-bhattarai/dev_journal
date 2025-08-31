import { addAuthToken } from '../../utils/api';

describe('API Utils - Token Interceptor', () => {
  beforeEach(() => {
    localStorage.clear(); // Clear storage before each test
  });

  it('adds token to headers for authenticated requests', () => {
    const token = 'fake-token';
    localStorage.setItem('token', token); // Mock token in storage

    const config = { headers: {} };
    const updatedConfig = addAuthToken(config);

    expect(updatedConfig.headers.Authorization).toBe(`Bearer ${token}`);
  });

  it('does not add token if none is present', () => {
    const config = { headers: {} };
    const updatedConfig = addAuthToken(config);

    expect(updatedConfig.headers.Authorization).toBeUndefined();
  });
});