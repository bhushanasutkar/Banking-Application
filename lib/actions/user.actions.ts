'use server'

import { cookies } from "next/headers";
import { createAdminClient, createSessionClient } from "../appwrite";
import {ID} from "node-appwrite"
import { parseStringify } from "../utils";

export const signIn = async ({email, password}: signInProps)=>{
    try {
        //Mutation /Database ? Fetch action
        const { account } = await createAdminClient();
        const response = await account.createEmailPasswordSession(email,password);
        console.log("signinsuccess",response);
        cookies().set("appwrite-session", response.secret, {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: true,
        });
        return parseStringify(response);
    } catch (error) {
        console.log('signinsuccessError', error);
    }
}
// SignUpParams these are the setup interfaces used in typescript to define the stucture of the input that we are going to pass to a function. If the structure is incorrect we will get error
export const signUp = async (userData:SignUpParams)=>{
    // destructuring
    
    const {email,password, firstName, lastName} = userData;
    try {
        //create a user account
        const { account } = await createAdminClient();
        // const session = await account.createEmailSession(email, password);
        const newUserAccount = await account.create(ID.unique(), email, password, `${firstName} ${lastName}`);
        const session = await account.createEmailPasswordSession(email, password);
      
        cookies().set("appwrite-session", session.secret, {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: true,
        });

        return parseStringify(newUserAccount);
        // in next js you cannot pass entire object through server actions so we need to stringify it
    } catch (error) {
        console.log('Error', error);
    }
}


export async function getLoggedInUser() {
    try {
      const { account } = await createSessionClient();
      const user = await account.get();
      console.log("getloogedinsuccess",user);
      // converting to JSOn sting in order to pass it to client because we need to pass the data in JSON format from server to client for their readability
      return parseStringify(user);    
    } catch (error) {
        console.log("getloogedinerror", error)
      return null;
    }
  }
  

  export const logoutAccount = async () =>{
    try {
        const { account } = await createSessionClient();
        cookies().delete('appwrite-session');

        await account.deleteSession('current');

    } catch (error) {
        return null;
    }
  }