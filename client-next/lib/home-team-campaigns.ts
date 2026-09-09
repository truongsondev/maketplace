export type HomeTeamCampaign = {
  id: string;
  title: string;
  description: string;
  image: string;
  collectionSlug: string;
  query: string;
  usageOccasion?: string;
  scope?: "all";
};

export type HomeOutfitHighlight = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  ctaLabel: string;
  collectionSlug: string;
  query: string;
  usageOccasion?: string;
};

export function buildCollectionCampaignHref(
  collectionSlug: string,
  query: string,
  usageOccasion?: string,
  scope?: "all",
) {
  const searchParams = new URLSearchParams();
  if (query.trim()) {
    searchParams.set("q", query);
  }
  if (usageOccasion?.trim()) {
    searchParams.set("uo", usageOccasion.trim());
  }
  if (scope === "all") {
    searchParams.set("scope", "all");
  }
  const queryString = searchParams.toString();
  return queryString
    ? `/collection/${collectionSlug}?${queryString}`
    : `/collection/${collectionSlug}`;
}
