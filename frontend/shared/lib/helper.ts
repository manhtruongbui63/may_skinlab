export class Helper {
  static formatValidationError(errors: Record<string, string[]>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(errors).map(([key, value]) => [key, value[0]])
    );
  }
}