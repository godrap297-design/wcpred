import { FIREBASE_CONFIG, FIREBASE_OPTIONS } from "./firebase-config.js";

let app;
let db;
let auth;
let modules;

export function isFirebaseConfigured() {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.appId);
}

export async function initFirebase() {
  if (!isFirebaseConfigured()) return null;
  if (app && db) return { app: app, db: db, auth: auth, modules: modules };
  const appModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
  const firestore = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  const authModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");
  app = appModule.initializeApp(FIREBASE_CONFIG);
  db = firestore.getFirestore(app);
  auth = authModule.getAuth(app);
  modules = Object.assign({}, firestore, authModule);
  return { app: app, db: db, auth: auth, modules: modules };
}

export async function signInAdmin(email, password) {
  const client = await initFirebase();
  if (!client) throw new Error("Firebase is not configured. Use the local passcode or add Firebase keys.");
  return client.modules.signInWithEmailAndPassword(client.auth, email, password);
}

export async function signOutAdmin() {
  const client = await initFirebase();
  if (client) await client.modules.signOut(client.auth);
}

export async function readSettings() {
  const client = await initFirebase();
  if (!client) return null;
  const snap = await client.modules.getDoc(client.modules.doc(client.db, FIREBASE_OPTIONS.settingsDocument));
  return snap.exists() ? snap.data() : null;
}

export async function saveSettings(settings) {
  const client = await initFirebase();
  if (!client) return null;
  return client.modules.setDoc(client.modules.doc(client.db, FIREBASE_OPTIONS.settingsDocument), Object.assign({}, settings, { updatedAt: client.modules.serverTimestamp() }), { merge: true });
}

export async function fetchSubmissions() {
  const client = await initFirebase();
  if (!client) return [];
  const q = client.modules.query(client.modules.collection(client.db, FIREBASE_OPTIONS.submissionsCollection), client.modules.orderBy("createdAt", "desc"));
  const snap = await client.modules.getDocs(q);
  return snap.docs.map(function (item) { return Object.assign({ id: item.id }, item.data()); });
}

export async function addSubmissionToFirebase(payload) {
  const client = await initFirebase();
  if (!client) return null;
  const now = client.modules.serverTimestamp();
  return client.modules.addDoc(client.modules.collection(client.db, FIREBASE_OPTIONS.submissionsCollection), Object.assign({}, payload, { createdAt: now, updatedAt: now }));
}

export async function findSubmissionByPhone(phone) {
  const client = await initFirebase();
  if (!client) return null;
  const q = client.modules.query(client.modules.collection(client.db, FIREBASE_OPTIONS.submissionsCollection), client.modules.where("participant.phoneNormalized", "==", phone), client.modules.limit(1));
  const snap = await client.modules.getDocs(q);
  return snap.empty ? null : Object.assign({ id: snap.docs[0].id }, snap.docs[0].data());
}
