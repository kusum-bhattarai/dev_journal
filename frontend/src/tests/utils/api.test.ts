import { addAuthToken } from '../../utils/api';

describe('API Utils - Token Interceptor', () => {
  // A helper to store the original localStorage
  const originalLocalStorage = window.localStorage;

  beforeEach(() => {
    // Mock localStorage for each test
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original localStorage after each test
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
    });
  });

  it('adds an Authorization header if a token exists in localStorage', () => {
    // Arrange: Setup the test case
    const token = 'fake-jwt-token';
    (window.localStorage.getItem as jest.Mock).mockReturnValue(token);
    const config = { headers: {} as any };

    // Act: Call the function we're testing
    const updatedConfig = addAuthToken(config);

    // Assert: Check the result
    expect(window.localStorage.getItem).toHaveBeenCalledWith('token');
    expect(updatedConfig.headers.Authorization).toBe(`Bearer ${token}`);
  });

  it('does not add an Authorization header if no token exists', () => {
    // Arrange
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    const config = { headers: {} as any };

    // Act
    const updatedConfig = addAuthToken(config);

    // Assert
    expect(updatedConfig.headers.Authorization).toBeUndefined();
  });
});