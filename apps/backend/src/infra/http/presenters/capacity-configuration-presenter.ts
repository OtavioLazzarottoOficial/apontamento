export class CapacityConfigurationPresenter {
  static toHTTP(efficiencyPercentage: number) {
    return { eficienciaPercentual: efficiencyPercentage };
  }
}
