import React, { useCallback, useEffect, useState } from 'react'
import {PlaidLinkOnSuccess,PlaidLinkOptions, usePlaidLink} from 'react-plaid-link';
import { Button } from './ui/button'
import { useRouter } from 'next/navigation';
import { createLinkToken, exchangePublictoken } from '@/lib/actions/user.actions';

const PlaidLink = ({user, variant}:PlaidLinkProps) => {
    const router = useRouter();

    const [token, settoken] = useState('');
    // here <PlaidLinkOnSuccess> is TypeScript type annotation
    const onSuccess = useCallback<PlaidLinkOnSuccess>(async(public_token:string)=>{
            await exchangePublictoken({
                publicToken:public_token,
                user,
            })
            router.push('/')
    },[user])

    // useEffect(async() => {
    //   this is not possbile . cannot use async here
    // }, [])

    useEffect(() => {
      const getLinkToken= async()=>{
        const data= await createLinkToken(user);

        settoken(data?.linkToken)
      }

      getLinkToken();
    }, [user])
    

    const config:PlaidLinkOptions ={
        token,
        onSuccess
    }

    const {open, ready} =usePlaidLink(config);

  return (
    <>
    {variant==='primary'?(
        <Button
        onClick={()=>{open()}}
        disabled={!ready}
        className='plaidlink-primary'

        
        >
            Connect Bank
        </Button>
    ):variant==='ghost'?(
        <Button>
            Connect bank
        </Button>
    ):(
        <Button>
            Connect bank
        </Button>
    )}
    </>
  )
}

export default PlaidLink