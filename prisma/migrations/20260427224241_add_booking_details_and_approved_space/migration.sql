-- AlterTable: adiciona description, approvedSpace, importedFromSpreadsheet
ALTER TABLE "booking" ADD COLUMN     "approvedSpace" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "importedFromSpreadsheet" BOOLEAN NOT NULL DEFAULT false;

-- DataMigration: slug antigo "m01" -> "sala-reuniao-1" (unificacao de SPACE_OPTIONS).
-- Aplicado em ambas as colunas defensivamente: spaceSecondOption tinha 0 ocorrencias no SELECT
-- pre-migration mas pode ter mudado entre o SELECT e o apply.
UPDATE "booking" SET "spaceFirstOption" = 'sala-reuniao-1' WHERE "spaceFirstOption" = 'm01';
UPDATE "booking" SET "spaceSecondOption" = 'sala-reuniao-1' WHERE "spaceSecondOption" = 'm01';
