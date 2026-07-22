import { resolveOpenApiServerUrl } from './openapi';

describe('OpenAPI server URL', () => {
  it('keeps a local origin unchanged', () => {
    expect(resolveOpenApiServerUrl('http://localhost:3000')).toBe(
      'http://localhost:3000',
    );
  });

  it('removes trailing slashes from a deployment origin', () => {
    expect(
      resolveOpenApiServerUrl(
        'https://elearning-corporativo-esen.onrender.com///',
      ),
    ).toBe('https://elearning-corporativo-esen.onrender.com');
  });
});
