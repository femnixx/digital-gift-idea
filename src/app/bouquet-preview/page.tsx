'use client'

import DigitalBouquetBuilder from '@/components/features/DigitalBouquetBuilder'

/**
 * Preview page for the standalone bouquet builder.
 *
 * The builder itself is deliberately free of app-specific imports so it can be
 * copied out on its own; this page exists only to make it viewable.
 */
export default function BouquetPreviewPage() {
  return <DigitalBouquetBuilder />
}
