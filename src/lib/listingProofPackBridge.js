import { createProofPack } from "./proofPackContract.js";

export function attachProofPackToListing(listing = {}) {
  if (listing.proofPack && listing.proofPack.proofPackVersion) {
    return listing;
  }

  return {
    ...listing,
    proofPack: createProofPack(listing)
  };
}

export function hasProofPack(listing = {}) {
  return Boolean(listing.proofPack && listing.proofPack.proofPackVersion);
}