import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!uri) {
  // If URI is missing, create a rejected promise so it fails when used, not when imported.
  clientPromise = Promise.reject(new Error("❌ ไม่มี MONGODB_URI ในไฟล์ .env.local"));
} else {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

export default clientPromise;
