export class InvalidLineValuesError extends Error {
  constructor() {
    super(
      'Informe quantidades inteiras não negativas, com realizada menor ou igual à necessária, tempos válidos e dimensões no formato comprimento x largura x espessura.',
    );
  }
}
