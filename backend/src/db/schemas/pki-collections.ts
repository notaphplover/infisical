// Code generated by automation script, DO NOT EDIT.
// Automated by pulling database and generating zod schema
// To update. Just run npm run generate:schema
// Written by akhilmhdh.

import { z } from "zod";

import { TImmutableDBKeys } from "./models";

export const PkiCollectionsSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  projectId: z.string(),
  name: z.string(),
  description: z.string()
});

export type TPkiCollections = z.infer<typeof PkiCollectionsSchema>;
export type TPkiCollectionsInsert = Omit<z.input<typeof PkiCollectionsSchema>, TImmutableDBKeys>;
export type TPkiCollectionsUpdate = Partial<Omit<z.input<typeof PkiCollectionsSchema>, TImmutableDBKeys>>;