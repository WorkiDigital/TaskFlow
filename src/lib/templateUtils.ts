/**
 * Simple template rendering utility.
 * Replaces placeholders of the form `{key}` with the corresponding value
 * from the `variables` map. If a key is missing, the placeholder is left
 * untouched.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number>,
): string {
  return template.replace(/{(\w+)}/g, (_, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}
