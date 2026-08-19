import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Cliente S3 apontando pro Cloudflare R2. Toda a lógica de upload roda no
 * servidor (Server Actions) — as credenciais nunca vão pro client, ao
 * contrário do fluxo antigo com Supabase Storage (que subia direto do
 * browser com a anon key).
 */
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

/** Base pública do bucket (Public Development URL do R2 ou domínio customizado), sem "/" no final. */
function urlPublicaBase() {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) throw new Error("R2_PUBLIC_URL não configurada.");
  return base.replace(/\/$/, "");
}

/**
 * Sobe um arquivo pro R2 num caminho específico (ex: `logos/{id}/logo.png`)
 * e devolve a URL pública final.
 */
export async function subirArquivo(caminho: string, arquivo: File): Promise<string> {
  const buffer = Buffer.from(await arquivo.arrayBuffer());

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: caminho,
      Body: buffer,
      ContentType: arquivo.type || "application/octet-stream",
    })
  );

  return `${urlPublicaBase()}/${caminho}`;
}

export async function removerArquivo(caminho: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: caminho }));
}

/** Extrai o "Key" (caminho dentro do bucket) a partir de uma URL pública já salva no banco. */
export function caminhoDaUrl(url: string): string {
  return url.replace(`${urlPublicaBase()}/`, "");
}
