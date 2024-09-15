// src/lib/server/appwrite.js
"use server";
import { cookies } from "next/headers";
import { Client, Account, Databases, Users } from "node-appwrite";

// this is for creating session with appwrite
export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

  const session = cookies().get("appwrite-session");
  if (!session || !session.value) {
    throw new Error("No session");
  }

  client.setSession(session.value);
  return {
    get account() {
      return new Account(client);
    },
  };
}

// this is for ppwrite admin dashboard like acceessing database authentication and all
export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setKey(process.env.NEXT_APPWRITE_KEY!);

  return {
    get account() {
      return new Account(client);
    },
    get database(){
        return new Databases(client);
    },
    get user(){
        return new Users(client);
    }
  };
}
