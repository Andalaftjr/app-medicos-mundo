import admin from "firebase-admin";
import fs from "node:fs/promises";
import path from "node:path";

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  throw new Error("Defina GOOGLE_APPLICATION_CREDENTIALS com o caminho do JSON do Firebase Admin.");
}

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(await fs.readFile(serviceAccountPath, "utf8"))
  ),
});

const db = admin.firestore();
const collections = ["assistidos", "anamneses", "triagens", "atendimentos", "users"];
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.resolve("backups", `firestore-${stamp}`);

await fs.mkdir(outDir, { recursive: true });

for (const name of collections) {
  const snap = await db.collection(name).get();
  const rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  await fs.writeFile(
    path.join(outDir, `${name}.json`),
    JSON.stringify(rows, null, 2),
    "utf8"
  );
  console.log(`${name}: ${rows.length} documentos exportados`);
}

console.log(`Backup concluído em: ${outDir}`);