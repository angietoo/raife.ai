import { Firestore } from "@google-cloud/firestore";

let database: Firestore | undefined;

export function getDb() {
  database ??= new Firestore({
    projectId:
      process.env.GOOGLE_CLOUD_PROJECT ??
      process.env.GCLOUD_PROJECT ??
      process.env.FIREBASE_PROJECT_ID,
  });

  return database;
}
