CREATE TABLE "animal_species" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animal_species_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "animal_species_name_key" ON "animal_species"("name");

CREATE TABLE "animal_breed" (
    "id" UUID NOT NULL,
    "species_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animal_breed_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "animal_breed_species_id_name_key" ON "animal_breed"("species_id", "name");

ALTER TABLE "animal_breed" ADD CONSTRAINT "animal_breed_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "animal_species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- data awal: jenis umum + semua jenis yang sudah dipakai pasien
INSERT INTO "animal_species" ("id", "name", "updated_at")
SELECT gen_random_uuid(), v.name, now() FROM (VALUES ('Kucing'), ('Anjing'), ('Kelinci'), ('Burung'), ('Hamster'), ('Reptil')) AS v(name);

INSERT INTO "animal_species" ("id", "name", "updated_at")
SELECT gen_random_uuid(), min(trim(p."species")), now()
FROM "patient" p
WHERE trim(p."species") <> '' AND NOT EXISTS (SELECT 1 FROM "animal_species" s WHERE lower(s."name") = lower(trim(p."species")))
GROUP BY lower(trim(p."species"));

INSERT INTO "animal_breed" ("id", "species_id", "name", "updated_at")
SELECT gen_random_uuid(), s."id", b.name, now()
FROM (VALUES
  ('Kucing', 'Domestik'), ('Kucing', 'Persia'), ('Kucing', 'Anggora'), ('Kucing', 'Siam'), ('Kucing', 'Maine Coon'), ('Kucing', 'Ragdoll'), ('Kucing', 'Bengal'), ('Kucing', 'Himalaya'),
  ('Anjing', 'Golden Retriever'), ('Anjing', 'Pomeranian'), ('Anjing', 'Shih Tzu'), ('Anjing', 'Poodle'), ('Anjing', 'Husky'), ('Anjing', 'Bulldog'), ('Anjing', 'Chihuahua'), ('Anjing', 'Campuran')
) AS b(species, name)
JOIN "animal_species" s ON s."name" = b.species;

INSERT INTO "animal_breed" ("id", "species_id", "name", "updated_at")
SELECT gen_random_uuid(), s."id", min(trim(p."breed")), now()
FROM "patient" p
JOIN "animal_species" s ON lower(s."name") = lower(trim(p."species"))
WHERE p."breed" IS NOT NULL AND trim(p."breed") <> ''
  AND NOT EXISTS (SELECT 1 FROM "animal_breed" ab WHERE ab."species_id" = s."id" AND lower(ab."name") = lower(trim(p."breed")))
GROUP BY s."id", lower(trim(p."breed"));

-- samakan penulisan data lama dengan master bila namanya cocok
UPDATE "patient" p SET "species" = s."name" FROM "animal_species" s WHERE lower(trim(p."species")) = lower(s."name") AND p."species" <> s."name";

UPDATE "patient" p SET "breed" = ab."name"
FROM "animal_species" s JOIN "animal_breed" ab ON ab."species_id" = s."id"
WHERE lower(s."name") = lower(p."species") AND p."breed" IS NOT NULL AND lower(trim(p."breed")) = lower(ab."name") AND p."breed" <> ab."name";
