/**
 * Plant detail page route - rendering is handled by ClientApp in root layout.
 * For static export, we generate a single placeholder param so Next.js
 * recognizes the dynamic segment. At runtime, Firebase Hosting's SPA
 * fallback serves index.html for all /plants/* paths.
 */

export async function generateStaticParams() {
  return [{ id: '_' }]
}

export default async function PlantDetailPage(props: { params: Promise<{ id: string }> }) {
  return null
}
