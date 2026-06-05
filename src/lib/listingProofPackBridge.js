import { createProofPack } from "./proofPackContract.js";
import { recordSellCoreAction } from "./sellcoreActionControlCenter.js";

export function attachProofPackToListing(listing = {}) {
  const proofPack = createProofPack(listing);

  const enhancedListing = {
    ...listing,
    proofPack
  };

  recordSellCoreAction("proofpack_attached", {
    listingId: listing.id || null,
    proofPackVersion: proofPack.proofPackVersion,
    verificationStatus: proofPack.verificationStatus
  });

  recordSellCoreAction("proofpack_signal_logged", {
    listingId: listing.id || null,
    trustScore: proofPack.trustScore || 0,
    condition: proofPack.condition || "unverified"
  });

  return enhancedListing;
}

export function hasProofPack(listing = {}) {
  return Boolean(listing.proofPack && listing.proofPack.proofPackVersion);
}
