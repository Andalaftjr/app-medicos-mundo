/* global require, exports */

const admin = require("firebase-admin");
const functions = require("firebase-functions/v1");

admin.initializeApp();

const db = admin.firestore();
const FIELD_VALUE = admin.firestore.FieldValue;

const PUBLIC_ROLES = new Set([
  "admin", "coordenador", "voluntario_eficiente", "colaborador_servico",
  "academico", "profissional_formado", "voluntario", "enfermeiro", "medico",
  "psicologo", "odonto", "nutricionista", "fisioterapeuta", "advogado",
  "biomedico", "veterinario",
]);

const PUBLIC_PROFESSIONS = new Set([
  "medicina", "odontologia", "psicologia", "nutricao", "fisioterapia",
  "enfermagem", "biomedicina", "veterinaria", "direito", "farmacia",
  "servico_social", "podologia", "beleza", "brinquedoteca",
  "apoio_operacional", "cadastro_triagem", "vacinacao", "exames_clinicos",
  "cabeleireiro", "apoio_mulher", "documentacao", "acolhimento", "doacoes",
  "apoio_transversal",
]);

async function getActorProfile(context) {
  if (!context.auth?.uid || context.auth?.token?.email_verified !== true) {
    throw new functions.https.HttpsError("permission-denied", "E-mail nao confirmado ou sessao invalida.");
  }
  const profileSnapshot = await db.collection("users").doc(context.auth.uid).get();
  if (!profileSnapshot.exists) {
    throw new functions.https.HttpsError("permission-denied", "Perfil operacional nao encontrado.");
  }
  return { uid: context.auth.uid, ...profileSnapshot.data() };
}

exports.updateUserAccess = functions
  .region("southamerica-east1")
  .https
  .onCall(async (data, context) => {
    const actor = await getActorProfile(context);
    if (actor.role !== "admin") {
      throw new functions.https.HttpsError("permission-denied", "Somente administradores podem alterar cargos.");
    }

    const targetUid = String(data?.targetUid || "").trim();
    const role = String(data?.role || "").trim();
    const profissao = String(data?.profissao || "").trim();
    const filial = String(data?.filial || "Santos").trim() || "Santos";

    if (!targetUid || !PUBLIC_ROLES.has(role) || !PUBLIC_PROFESSIONS.has(profissao)) {
      throw new functions.https.HttpsError("invalid-argument", "Perfil, profissao ou usuario invalido.");
    }

    const targetRef = db.collection("users").doc(targetUid);
    const beforeSnapshot = await targetRef.get();
    if (!beforeSnapshot.exists) {
      throw new functions.https.HttpsError("not-found", "Usuario nao encontrado.");
    }
    const before = beforeSnapshot.data();
    const updates = {
      role,
      profissao,
      filial,
      roleUpdatedAt: FIELD_VALUE.serverTimestamp(),
      roleUpdatedBy: actor.uid,
      perfilAdminAtualizadoEm: FIELD_VALUE.serverTimestamp(),
    };

    await targetRef.set(updates, { merge: true });
    await admin.auth().setCustomUserClaims(targetUid, { role, profissao, filial });
    await db.collection("admin_audit").add({
      action: "user_access_update",
      actorUid: actor.uid,
      actorRole: actor.role,
      targetUid,
      beforeRole: before.role || "",
      afterRole: role,
      beforeProfissao: before.profissao || "",
      afterProfissao: profissao,
      beforeFilial: before.filial || "",
      afterFilial: filial,
      createdAt: FIELD_VALUE.serverTimestamp(),
    });

    return { ok: true };
  });

exports.revokeUserAccess = functions
  .region("southamerica-east1")
  .https
  .onCall(async (data, context) => {
    const actor = await getActorProfile(context);
    if (!["admin", "coordenador"].includes(actor.role)) {
      throw new functions.https.HttpsError("permission-denied", "Apenas administracao ou coordenacao pode revogar acesso.");
    }

    const targetUid = String(data?.targetUid || "").trim();
    if (!targetUid || targetUid === actor.uid) {
      throw new functions.https.HttpsError("invalid-argument", "Usuario alvo invalido.");
    }

    const targetRef = db.collection("users").doc(targetUid);
    const beforeSnapshot = await targetRef.get();
    if (!beforeSnapshot.exists) {
      throw new functions.https.HttpsError("not-found", "Usuario nao encontrado.");
    }
    const before = beforeSnapshot.data();
    if (actor.role === "coordenador" && ["admin", "coordenador"].includes(before.role)) {
      throw new functions.https.HttpsError("permission-denied", "Coordenacao nao revoga administradores ou coordenadores.");
    }

    await db.collection("admin_audit").add({
      action: "access_revoke",
      actorUid: actor.uid,
      actorRole: actor.role,
      targetUid,
      deletedRole: before.role || "",
      createdAt: FIELD_VALUE.serverTimestamp(),
    });
    await targetRef.delete();
    await admin.auth().updateUser(targetUid, { disabled: true }).catch(() => null);
    return { ok: true };
  });

exports.closePendingProfessionalAttendances = functions
  .region("southamerica-east1")
  .pubsub
  .schedule("59 23 * * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async () => {
    const snapshot = await db
      .collection("atendimentos")
      .where("status", "==", "Aguardando Profissional")
      .get();

    if (snapshot.empty) {
      console.log("Nenhum atendimento pendente para encerramento automatico.");
      return null;
    }

    let batch = db.batch();
    let batchSize = 0;
    let updated = 0;

    for (const document of snapshot.docs) {
      batch.update(document.ref, {
        status: "Não Finalizado (Sistema)",
        statusAnterior: "Aguardando Profissional",
        encerradoSistemaEm: FIELD_VALUE.serverTimestamp(),
        encerradoSistemaMotivo: "Encerramento automatico de fim do dia",
      });
      batchSize += 1;
      updated += 1;

      if (batchSize === 450) {
        await batch.commit();
        batch = db.batch();
        batchSize = 0;
      }
    }

    if (batchSize > 0) await batch.commit();

    console.log(`${updated} atendimento(s) encerrado(s) automaticamente.`);
    return null;
  });
