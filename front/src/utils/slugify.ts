export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export const generateProjectSlug = (title: string, id: string): string => {
  const slug = slugify(title);
  return `${id}-${slug}`;
};

export const extractIdFromSlug = (idWithSlug: string | undefined): string | undefined => {
  if (!idWithSlug) return undefined;
  
  // Extract the UUID part (first segment before the first dash)
  const uuidPattern = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const match = idWithSlug.match(uuidPattern);
  
  if (!match) {
    console.error('Invalid slug format:', idWithSlug);
    return undefined;
  }
  
  return match[1];
};