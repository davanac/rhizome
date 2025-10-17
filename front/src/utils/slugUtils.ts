export const extractIdFromSlug = (idWithSlug: string | undefined): string | undefined => {
  if (!idWithSlug) return undefined;
  
  // L'ID est un UUID, donc il a toujours 36 caractères
  const uuidLength = 36;
  return idWithSlug.substring(0, uuidLength);
};