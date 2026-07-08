/**
 * Read-only diagnostic: find task/announcement docs with a missing or blank
 * title (the ones that render as blank rows in the app).
 *
 *   node scripts/scan-blank-tasks.mjs <your-email> <your-password>
 *
 * Signs in as the account you pass (any signed-in user can read classes + their
 * tasks per your rules) and walks each class's tasks + announcements
 * subcollections. Prints the class/doc ids of any offender so you can fix or
 * delete them in the Firebase console. Writes nothing.
 */
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// load EXPO_PUBLIC_* config from .env (same as the seeder)
const env = {};
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

const blank = (v) => v === undefined || v === null || String(v).trim() === "";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node scripts/scan-blank-tasks.mjs <your-email> <your-password>");
  process.exit(1);
}

const run = async () => {
  await signInWithEmailAndPassword(auth, email, password);
  const classes = await getDocs(collection(db, "classes"));
  let offenders = 0;

  for (const cls of classes.docs) {
    const className = cls.data().name ?? "(unnamed class)";
    for (const sub of ["tasks", "announcements"]) {
      const docs = await getDocs(collection(db, "classes", cls.id, sub));
      for (const d of docs.docs) {
        if (blank(d.data().title)) {
          offenders++;
          console.log(
            `BLANK ${sub.slice(0, -1)}: classes/${cls.id}/${sub}/${d.id}` +
              `  (class: "${className}")`,
          );
        }
      }
    }
  }

  console.log(
    offenders === 0
      ? "\n✅ No blank-title tasks or announcements found."
      : `\n⚠ Found ${offenders} doc(s) with a missing/blank title (paths above).`,
  );
  process.exit(0);
};

run().catch((e) => {
  console.error("scan failed:", e.message);
  process.exit(1);
});
