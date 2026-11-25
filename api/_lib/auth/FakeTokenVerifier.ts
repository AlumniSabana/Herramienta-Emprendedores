import type { TokenVerifier } from './TokenVerifier';

/** Para pruebas: tokens conocidos → userId. */
export class FakeTokenVerifier implements TokenVerifier {
  constructor(private readonly tokens: Record<string, string>) {}

  async verify(accessToken: string) {
    const userId = this.tokens[accessToken];
    return userId ? { userId } : null;
  }
}
