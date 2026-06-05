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

  return enhancedListing;
}

export function hasProofPack(listing = {}) {
  return Boolean(listing.proofPack && listing.proofPack.proofPackVersion);
}
