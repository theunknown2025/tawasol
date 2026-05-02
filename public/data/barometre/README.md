# Morocco Barometre data format

Place your 3 GeoJSON files in this folder:

- `morocco-regions.geojson`
- `morocco-provinces.geojson`
- `morocco-communes.geojson`

Each file must be a valid `FeatureCollection`.

## Required properties per feature

```json
{
  "id": "string-unique-id",
  "name": "display name",
  "parentId": "parent level id (required for provinces and communes)"
}
```

## Level rules

- Regions: `id`, `name`
- Provinces: `id`, `name`, `parentId` (points to region `id`)
- Communes: `id`, `name`, `parentId` (points to province `id`)

## Compatibility notes

The UI tries to auto-map common keys if you use other sources:

- `id` fallback: `code`, `shapeID`, `shapeId`
- `name` fallback: `nom`, `shapeName`
- `parentId` fallback: `parent_id`, `region_id`, `province_id`

The current project already includes:

- `/public/data/morocco-provinces.geojson`
- `/public/data/morocco-communes.geojson`

If no local `barometre` file exists for provinces/communes, the app falls back to these files.
