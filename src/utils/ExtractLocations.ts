const ExtractLocations = (input: string): string => {
  const normalizedInput = input.replace(/\s+/g, ' ').trim();
  const locations = normalizedInput.split(/\s+\d+\s+\d{1,2}:\d{2}\s*(?:AM|PM)\b\s*/i);

  if (locations.length === 1) {
    return input;
  }

  return locations
    .map((location) => location.trim())
    .filter((location) => location.length > 0)
    .join('\n');
};

export default ExtractLocations;
