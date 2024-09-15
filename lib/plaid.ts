import {Configuration, PlaidApi, PlaidEnvironments} from 'plaid';

// plaid sdk
const configuration = new Configuration({
    basePath:PlaidEnvironments.sandbox,
    baseOptions:{
        headers:{
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET':process.env.PLAID_SECRET
        }
    }
})


// creating a client and exposing it to our application
export const plaidClient = new PlaidApi(configuration);