import { z } from "zod";

const name = z.string().trim().min(1, "Nama wajib diisi").max(50, "Maksimal 50 karakter");

export const speciesSchema = z.object({ name, active: z.boolean() });
export const breedSchema = z.object({ speciesId: z.guid({ error: "Pilih jenis hewan" }), name, active: z.boolean() });

export type SpeciesInput = z.infer<typeof speciesSchema>;
export type BreedInput = z.infer<typeof breedSchema>;

export const breedsOf = (breeds: { species: string; name: string }[], species: string) =>
  breeds.filter((b) => b.species.toLowerCase() === species.trim().toLowerCase()).map((b) => b.name);
