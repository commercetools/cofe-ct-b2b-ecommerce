function generateParameterString(parameters: any) {
  const parameterPairs: any[] = [];

  // Recursively traverse the parameters object
  function traverse(obj: any, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const paramName = prefix ? `${prefix}.${key}` : key;
      if (Array.isArray(value)) {
        const arrayValues = value.map((item) => JSON.stringify(item)).join(', ');
        parameterPairs.push(`${paramName}: [${arrayValues}]`);
      } else if (typeof value === 'object' && value !== null) {
        const objectValue = generateParameterString(value);
        parameterPairs.push(`${paramName}: ${objectValue}`);
      } else {
        parameterPairs.push(`${paramName}: ${JSON.stringify(value)}`);
      }
    }
  }

  traverse(parameters);

  return `{ ${parameterPairs.join(', ')} }`.replace(/"([^"]+)":/g, '$1:');
}
export function parametersToString(parameters: any) {
  const result = generateParameterString(parameters);
  return result.slice(1, -1);
}
