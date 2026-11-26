import { Encrypter } from '../../src/domain/auth/application/cryptography/encrypter.ts';

export class FakerJWT implements Encrypter {
  async encrypt(payload: any): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    return `jwt-${JSON.stringify(payload)}`;
  }
}
