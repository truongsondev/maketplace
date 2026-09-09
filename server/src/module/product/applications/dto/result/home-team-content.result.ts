export interface HomeTeamCardResult {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  collectionSlug: string;
  query: string;
  usageOccasion?: string;
  scope?: 'all';
}

export interface HomeOutfitHighlightResult {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  collectionSlug: string;
  query: string;
  usageOccasion?: string;
}

export interface HomeOutfitGalleryItemResult {
  id: string;
  imageUrl: string;
  collectionSlug: string;
  query: string;
  usageOccasion?: string;
}

export interface HomeTeamContentResult {
  teamCards: HomeTeamCardResult[];
  highlights: HomeOutfitHighlightResult[];
  gallery: HomeOutfitGalleryItemResult[];
}
