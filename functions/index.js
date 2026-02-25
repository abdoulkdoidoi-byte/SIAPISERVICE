const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.database();

// Création utilisateur sécurisé
exports.createUser = functions.https.onCall(async (data, context) => {
  const { uid, nom, prenom, phone } = data;
  if(!uid || !nom || !prenom || !phone) throw new functions.https.HttpsError("invalid-argument", "Champs manquants");
  await db.ref("users/" + uid).set({ nom, prenom, phone, points: 0, money: 0 });
  return { message: "Utilisateur créé / connecté" };
});

// Conversion points → argent
exports.convertPoints = functions.https.onCall(async (data, context) => {
  const uid = data.uid;
  const userRef = db.ref("users/" + uid);
  const snap = await userRef.once("value");
  const user = snap.val();
  if(user.points >= 100){
    await userRef.update({ points: user.points - 100, money: (user.money||0) + 250 });
    return { message: "100 points convertis en 250 F" };
  } else return { message: "Il faut au moins 100 points pour convertir" };
});

// Retrait sécurisé
exports.retrait = functions.https.onCall(async (data, context) => {
  const { uid, type } = data;
  const userRef = db.ref("users/" + uid);
  const snap = await userRef.once("value");
  const user = snap.val();
  if(user.money >= 500){
    await userRef.update({ money: 0 });
    return { message: `Retrait ${user.money} F via ${type}` };
  } else return { message: "Il faut au moins 500 F pour retirer" };
});

// Vidéos
exports.watchVideo = functions.https.onCall(async (data, context) => {
  const uid = data.uid;
  const points = data.duration < 15 ? 10 : data.duration < 45 ? 50 : 100;
  await db.ref("users/" + uid + "/points").transaction(current => (current||0) + points);
  return { message: `Vous avez gagné ${points} points` };
});

// Films
exports.watchFilm = functions.https.onCall(async (data, context) => {
  const uid = data.uid;
  const points = data.duration < 15 ? 10 : data.duration < 45 ? 50 : 100;
  await db.ref("users/" + uid + "/points").transaction(current => (current||0) + points);
  return { message: `Vous avez gagné ${points} points` };
});

// Live
exports.followLive = functions.https.onCall(async (data, context) => {
  const uid = data.uid;
  const pts = data.points || 50;
  await db.ref("users/" + uid + "/points").transaction(current => (current||0) + pts);
  return { message: `Vous avez gagné ${pts} points` };
});

// Partage
exports.share = functions.https.onCall(async (data, context) => {
  const uid = data.uid;
  await db.ref("users/" + uid + "/points").transaction(current => (current||0) + 25);
  return { message: "Partage effectué, 25 points ajoutés" };
});

// Partage live
exports.shareLive = functions.https.onCall(async (data, context) => {
  const uid = data.uid;
  await db.ref("users/" + uid + "/points").transaction(current => (current||0) + 75);
  return { message: "Partage live effectué, 75 points ajoutés" };
});

// Téléchargements
exports.downloadVideo = functions.https.onCall(async (data, context) => {
  const uid = data.uid;
  await db.ref("users/" + uid + "/points").transaction(current => (current||0) + 0);
  return { message: "Vidéo téléchargée, points inchangés" };
});

exports.downloadFilm = functions.https.onCall(async (data, context) => {
  const uid = data.uid;
  await db.ref("users/" + uid + "/points").transaction(current => (current||0) + 0);
  return { message: "Film téléchargé, points inchangés" };
});
