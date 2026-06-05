function calculateTrustScore(listing = {}) {
  let score = 0;

  if (String(listing.title || "").trim()) score += 20;
  if (String(listing.note || listing.description || "").trim()) score += 20;
  if (String(listing.price || "").trim() && Number(listing.price) > 0) score += 15;
  if (String(listing.condition || "").trim()) score += 15;
  if (String(listing.location || "").trim()) score += 10;
  if (listing.imageData || listing.image || listing.photoData) score += 20;

  return Math.min(score, 100);
}

export function createProofPack(listing = {}) {
  const trustScore = calculateTrustScore(listing);

  return {
    proofPackVersion: "026",
    createdAt: new Date().toISOString(),

    condition: listing.condition || "unverified",
    verificationStatus: trustScore >= 70 ? "verified-lite" : "pending",
    sellerNote: listing.note || listing.description || "",
    trustScore,

    listingHistory: [
      {
        event: "listing_created",
        timestamp: new Date().toISOString()
      }
    ],

    listingId: listing.id || null
  };
}

export { calculateTrustScore };
