import { HashComparer } from '../../src/domain/auth/application/cryptography/hash-comparer.ts';
import { HashGenerator } from '../../src/domain/auth/application/cryptography/hash-generator.ts';

export class FakerEncrypter implements HashGenerator, HashComparer {
  async hash(value: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    return `hashed-${value}`;
  }

  async compare(value: string, hashedValue: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    return hashedValue === `hashed-${value}`;
  }
}
