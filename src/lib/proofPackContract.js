export function createProofPack(listing = {}) {
  return {
    proofPackVersion: "020",
    createdAt: new Date().toISOString(),

    condition: "unverified",
    verificationStatus: "pending",
    sellerNote: "",
    trustScore: 0,

    listingHistory: [
      {
        event: "listing_created",
        timestamp: new Date().toISOString()
      }
    ],

    listingId: listing.id || null
  };
}
