export function getBoardCardPreviewImage(modal) {
  const image = modal?.image;
  if (typeof image !== 'string' || image.trim() === '') return null;

  const normalizedPath = image.replaceAll('\\', '/');
  if (/(?:^|\/)assets\/Tiles\//i.test(normalizedPath)) return null;

  return image;
}
