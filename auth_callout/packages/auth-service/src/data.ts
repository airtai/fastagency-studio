import { AuthToken, PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export type User = {
  readonly pass: string;
  readonly account: string;
};

export type Room = {
  readonly users: ReadonlyArray<string>;
};

export type Data = {
  readonly users: Record<string, User>;
  readonly rooms: Record<string, Room>;
};

export async function readData(): Promise<Data> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rawData = await fs.readFile(path.join(__dirname, "../../../data.json"), "utf8");
  const data: Data = JSON.parse(rawData);
  return data;
}

export type Auth = {
  user: string;
  password: string;
  chat_uuid: string;
}

const prisma = new PrismaClient();

const wasp_prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })


export async function fetchAuthToken(deployment_uuid: string) {
  try {
    const authToken: AuthToken[] = await prisma.$queryRaw`SELECT * FROM "AuthToken" WHERE "deployment_uuid" = ${deployment_uuid}::uuid LIMIT 1`;
    return authToken.length > 0 ? authToken[0] : null; // Return the first authToken if found, else return null
  } catch (error) {
    console.error('Error fetching AuthToken by deployment_uuid:', error);
    return null; // Return null on error
  }
}

export async function checkChatUuid(chat_uuid: string) {
  try {
    const result = await wasp_prisma.$queryRaw`SELECT * FROM "Chat" WHERE "uuid" = ${chat_uuid} LIMIT 1`;
    const chats = Array.isArray(result) ? result : [result];
    return chats.length > 0 ? chats[0] : null; // Return the first chat if found, else return null
  } catch (error) {
    console.error('Error fetching Chat by chat_uuid:', error);
    return null; // Return null on error
  }
}

export async function verifyAuthToken(token: string, storedHash: string): Promise<boolean> {
  const parts: Array<string> = storedHash.split(':');
  if (parts.length !== 2) {
    return false;
  }

  // Split the stored hash into salt and hash
  const [salt, hashValue] = parts;
  // Check if salt and hashValue are defined
  if (!salt || !hashValue) {
    return false;
  }

  // Convert salt back to Uint8Array
  const saltBytes = new Uint8Array(salt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  // Combine salt and token
  const encoder = new TextEncoder();
  const tokenBytes = encoder.encode(token);
  const saltedToken = new Uint8Array(saltBytes.length + tokenBytes.length);
  saltedToken.set(saltBytes);
  saltedToken.set(tokenBytes, saltBytes.length);

  // Hash the salted token
  const computedHash = crypto.subtle.digest('SHA-256', saltedToken)
    .then(hash => Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    );

  // Compare the computed hash with the stored hash
  return computedHash.then(hash => hash === hashValue);
}
