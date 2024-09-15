'use server'
// for all server actions
import { cookies } from "next/headers";
import { createAdminClient, createSessionClient } from "../appwrite";
import {ID} from "node-appwrite"
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import {CountryCode, Products} from 'plaid'
import { plaidClient } from "../plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";

const {
  // below code for renaming APPWRITE_DATABASE_ID to DATABSE_ID,
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID:USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID:BANK_COLLECTION_ID,
} = process.env

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
export const signUp = async ({password,...userData}:SignUpParams)=>{
    // destructuring
    
    const {email, firstName, lastName} = userData;

    let newUserAccount;
    try {
        //create a user account
        const { account, database } = await createAdminClient();
        // const session = await account.createEmailSession(email, password);
         newUserAccount = await account.create(ID.unique(), email, password, `${firstName} ${lastName}`);

        if(!newUserAccount){
          throw new Error('Error creating user')
        }
// spread operator
        const dwollaCustomerUrl = await createDwollaCustomer({
          ...userData,  
          type:'personal'
        });
        console.log("Debug Dowolla Customer--->" ,dwollaCustomerUrl);
        if(!dwollaCustomerUrl){
          throw new Error("Error creating Dwolla customer");
          
        }

        const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);
        console.log("Debug Dowolla Customer Id--->",dwollaCustomerId)
        const newUser = await database.createDocument(
          DATABASE_ID!,
          USER_COLLECTION_ID!,
          ID.unique(),
          {
            ...userData,
            userId: newUserAccount.$id,
            dwollaCustomerId,
            dwollaCustomerUrl
          }
        )
        console.log("Debug Dowolla Id--->" ,dwollaCustomerId);
        console.log("Debug User--->",newUser);

        const session = await account.createEmailPasswordSession(email, password);
      
        cookies().set("appwrite-session", session.secret, {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: true,
        });

        return parseStringify(newUser);
        // in next js you cannot pass entire object through server actions so we need to stringify it
    } catch (error) {
        console.log('Error-->', error);
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


  export const createLinkToken=async (user:User)=>{
    try {
      const tokenParams={
        user:{
          client_user_id:user.$id
        },
        client_name:`${user.firstName} ${user.lastName}`,
        products:['auth'] as Products[],
        language:'en',
        country_codes:['US'] as CountryCode[],
        // check what the above code do?
      }

      const response = await plaidClient.linkTokenCreate(tokenParams);
      return parseStringify({linkToken:response.data.link_token})
    } catch (error) {
      console.log(error);
    }
  }

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  sharableId,
}: createBankAccountProps) => {
  try {
    // creating bankaccount as adocument within the database
    const {database} = await createAdminClient();
    
    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        sharableId,
      }
    )

    return parseStringify(bankAccount);
  } catch (error) {}
};


  // exchanges existing token(publicToken) for a token(accessToken) that allows us to do STUFF, banking stuff(A LOTS)
export const exchangePublictoken = async ({publicToken,user}: exchangePublicTokenProps)=>{
      try {
        const response = await plaidClient.itemPublicTokenExchange({
          public_token: publicToken,
        });
        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;

        // get account info from plaid using the access token
        const accountsResponse = await plaidClient.accountsGet({
          access_token: accessToken,
        });

        const accountData = accountsResponse.data.accounts[0];

        // Dwoola ---> payment processsor use for processing money through plaid

        // create  a processor token for Dwolla using the access token AND account ID
        const request: ProcessorTokenCreateRequest = {
          access_token: accessToken,
          account_id: accountData.account_id,
          processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
        };

        const processorTokenResponse = await plaidClient.processorTokenCreate(
          request
        );
        const processorToken = processorTokenResponse.data.processor_token;

        // Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
        const fundingSourceUrl = await addFundingSource({
          dwollaCustomerId: user.dwollaCustomerId,
          processorToken,
          bankName: accountData.name,
        });

        // If the funding source URL is not created, throw an error
        if (!fundingSourceUrl) throw Error;

        // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and sharable ID
        await createBankAccount({
          userId: user.$id,
          bankId: itemId,
          accountId: accountData.account_id,
          accessToken,
          fundingSourceUrl,
          sharableId: encryptId(accountData.account_id),
        });

        // Revalidate the path to reflect the changes
        revalidatePath("/");

        // Return a success message
        return parseStringify({
          publicTokenExchange: "complete",
        });
      } catch (error) {
        console.log("Error occurred while exchanging token:",error);
      }
}
