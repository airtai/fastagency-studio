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
