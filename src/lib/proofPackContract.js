const PROOF_PACK_VERSION = "020";

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function createProofPack(listing = {}) {
  const timestamp = new Date().toISOString();

  return {
    proofPackVersion: PROOF_PACK_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
    verificationStatus: "pending",
    condition: cleanText(listing.condition) || "unverified",
    sellerNote: cleanText(listing.note || listing.description),
    trustScore: 0,
    listingId: listing.id || null,
    events: [
      {
        type: "listing_created",
        createdAt: timestamp
      }
    ]
  };
}