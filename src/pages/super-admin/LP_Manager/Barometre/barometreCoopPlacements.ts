/**
 * Positions discrètes autour du centre d’une commune pour plusieurs repères (évite le chevauchement exact).
 */
export function spreadOffsetsAroundCenter(
  count: number,
  centerLat: number,
  centerLng: number,
): { lat: number; lng: number }[] {
  if (count <= 0) return [];
  if (count === 1) return [{ lat: centerLat, lng: centerLng }];
  const latRad = (centerLat * Math.PI) / 180;
  const cosLat = Math.max(Math.cos(latRad), 0.01);
  const radiusLat = 0.00042;
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const latOff = radiusLat * Math.cos(angle);
    const lngOff = (radiusLat / cosLat) * Math.sin(angle);
    return { lat: centerLat + latOff, lng: centerLng + lngOff };
  });
}
