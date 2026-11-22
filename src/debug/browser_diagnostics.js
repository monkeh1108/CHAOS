export function reportBrowserDiagnostic(level, message, error) {
  console[level](message, error);
}
