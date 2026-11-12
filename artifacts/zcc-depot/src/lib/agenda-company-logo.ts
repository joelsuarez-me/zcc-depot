export const companyLogoKey = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

export type CompanyLogoServices = {
  resolve: (name: string, signal: AbortSignal) => Promise<{ logoUrl: string | null }>;
  download: (url: string, signal: AbortSignal) => Promise<Blob>;
  store: (file: File, signal: AbortSignal) => Promise<string>;
};

// Research logos are short-lived and user-specific. Persist their bytes through
// the normal protected upload flow before using them in a shared agenda.
export async function findAgendaCompanyLogo(name: string, signal: AbortSignal, services: CompanyLogoServices) {
  signal.throwIfAborted();
  const company = await services.resolve(name.trim(), signal);
  signal.throwIfAborted();
  if (!company.logoUrl) return null;
  const image = await services.download(company.logoUrl, signal);
  signal.throwIfAborted();
  if (!["image/png", "image/jpeg", "image/webp"].includes(image.type) || !image.size || image.size > 8 * 1024 * 1024) {
    throw new Error("The company logo could not be used. Upload a PNG, JPEG, or WebP image up to 8 MB.");
  }
  const extension = image.type === "image/jpeg" ? "jpg" : image.type.split("/")[1];
  const path = await services.store(new File([image], `company-logo.${extension}`, { type: image.type }), signal);
  signal.throwIfAborted();
  return path;
}
