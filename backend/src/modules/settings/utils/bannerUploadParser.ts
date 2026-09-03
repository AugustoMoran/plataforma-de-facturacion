import { Request } from 'express';

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

export const getLocalBannerUrl = (req: Request, filename: string) =>
  `${req.protocol}://${req.get('host')}/uploads/${filename}`;

export const extractUploadedBannerUrls = (req: Request): string[] => {
  const files = (req.files as Express.Multer.File[] | undefined) || [];
  return files
    .map((file) => {
      const cloudUrl = (file as any).path;
      if (isHttpUrl(cloudUrl)) return cloudUrl;
      return getLocalBannerUrl(req, file.filename);
    })
    .filter(Boolean);
};

const fileToBannerUrl = (req: Request, file: Express.Multer.File) => {
  const cloudUrl = (file as any).path;
  if (isHttpUrl(cloudUrl)) return cloudUrl;
  return getLocalBannerUrl(req, file.filename);
};

export const extractPromoTripletSlotUrls = (req: Request): (string | null)[] => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;

  return [0, 1, 2].map((index) => {
    const uploaded = files?.[`slot${index}`]?.[0];
    if (uploaded) {
      return fileToBannerUrl(req, uploaded);
    }

    const existing = String(req.body?.[`existing${index}`] || '').trim();
    return existing || null;
  });
};
