import { Module } from '@nestjs/common';
import { BcryptHasher } from './bcrypt-hasher.ts';

import { JwtEncrypter } from './jwt-encrypter.ts';
import { Encrypter } from '../../domain/auth/application/cryptography/encrypter.ts';
import { HashComparer } from '../../domain/auth/application/cryptography/hash-comparer.ts';
import { HashGenerator } from '../../domain/auth/application/cryptography/hash-generator.ts';

@Module({
  providers: [
    {
      provide: Encrypter,
      useClass: JwtEncrypter,
    },
    {
      provide: HashComparer,
      useClass: BcryptHasher,
    },
    {
      provide: HashGenerator,
      useClass: BcryptHasher,
    },
  ],
  exports: [Encrypter, HashComparer, HashGenerator],
})
export class CryptographyModule {}
