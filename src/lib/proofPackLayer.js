export function createDefaultProofPack() {
  return {
    enabled: false,
    fileCount: 0,
    trustLevel: "basic",
    receiptAttached: false,
    warrantyAttached: false,
    extraMediaAttached: false,
    notesAttached: false,
    updatedAt: null
  };
}

export function normalizeProofPack(value = {}) {
  const source = value && typeof value === "object" ? value : {};

  return {
    ...createDefaultProofPack(),
    ...source,
    fileCount: Number(source.fileCount || 0),
    enabled: Boolean(source.enabled)
  };
}

export function getProofPackSummary(proofPack = {}) {
  const pack = normalizeProofPack(proofPack);

  if (!pack.enabled) {
    return "ProofPack Ready";
  }

  return `ProofPack Active • ${pack.fileCount} item${pack.fileCount === 1 ? "" : "s"}`;
}