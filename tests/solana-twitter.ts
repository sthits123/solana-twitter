import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaTwitter } from "../target/types/solana_twitter1";
import * as assert from "assert";
import * as bs58 from "bs58";

describe("solana-twitter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.solanaTwitter as Program<SolanaTwitter>;

  it('can send a new tweet', async () => {
    const tweet = anchor.web3.Keypair.generate();
    await program.rpc.sendTweet('veganism', 'Hummus, am I right?', {
        accounts: {
            tweet: tweet.publicKey,
            author: program.provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [tweet],
    });
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
  	//console.log(tweetAccount);
    // Ensure it has the right data.
    assert.equal(tweetAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58());
    assert.equal(tweetAccount.topic, 'veganism');
    assert.equal(tweetAccount.content, 'Hummus, am I right?');
    assert.ok(tweetAccount.timestamp);

   });

   it('can send a new tweet without a topic', async () => {
    const tweet = anchor.web3.Keypair.generate();
    await program.rpc.sendTweet('', 'Let us talk about solana', {
        accounts: {
            tweet: tweet.publicKey,
            author: program.provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [tweet],
    });
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
  	//console.log(tweetAccount);
    // Ensure it has the right data.
    assert.equal(tweetAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58());
    assert.equal(tweetAccount.topic, '');
    assert.equal(tweetAccount.content, 'Let us talk about solana');
    assert.ok(tweetAccount.timestamp);

  });
  
  it('can send a new tweet from a different author', async () => {
    // Generate another user and airdrop them some SOL.
    const otherUser = anchor.web3.Keypair.generate();
    
    const signature=await program.provider.connection.requestAirdrop(otherUser.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(signature);   

    // Call the "SendTweet" instruction on behalf of this other user.
    const tweet = anchor.web3.Keypair.generate();
    await program.rpc.sendTweet('veganism', 'Yay Tofu!', {
        accounts: {
            tweet: tweet.publicKey,
            author: otherUser.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [otherUser, tweet],
    });

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    // Ensure it has the right data.
    assert.equal(tweetAccount.author.toBase58(), otherUser.publicKey.toBase58());
    assert.equal(tweetAccount.topic, 'veganism');
    assert.equal(tweetAccount.content, 'Yay Tofu!');
    assert.ok(tweetAccount.timestamp);
   });
    
    it('cannot provide a topic with more than 50 characters', async () => {
    const tweet = anchor.web3.Keypair.generate();
    const longTopic = 'x'.repeat(51); // 51 characters
    const content = 'Valid content for the tweet';

    try {
        await program.rpc.sendTweet(longTopic, content, {
            accounts: {
                tweet: tweet.publicKey,
                author: program.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [tweet],
        });

        // If no error is thrown, the test should fail
      assert.fail('The instruction should have failed with a topic > 50 characters.');
    } 
    catch (error) {
       assert.strictEqual(error.error.errorCode.code, "TopicTooLong");
       assert.strictEqual(
        error.error.errorMessage,
        "The provided topic should be 50 characters long maximum.",
       );
     }
    
   });
    
    it('cannot provide a content with more than 280 characters', async () => {
    const tweet = anchor.web3.Keypair.generate();
    const longContent = 'x'.repeat(281); // 281 characters
    const topic = 'Blockchain development';

    try {
        await program.rpc.sendTweet(topic,longContent, {
            accounts: {
                tweet: tweet.publicKey,
                author: program.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [tweet],
        });

        // If no error is thrown, the test should fail
      assert.fail('The instruction should have failed with a content > 280 characters.');
    } 
    catch (error) {
      assert.strictEqual(error.error.errorCode.code, "ContentTooLong");
      assert.strictEqual(
        error.error.errorMessage,
        "The provided content should be 280 characters long maximum.",
      );
    }
    
   });
 
    it('can fetch all tweets', async () => {
      const tweetAccounts=await program.account.tweet.all();
      
      assert.equal(tweetAccounts.length,3);
      
    });
    
     it('can filter  tweets by author', async () => {
      const authorPublicKey=program.provider.wallet.publicKey;


      const tweetAccounts=await program.account.tweet.all(
          [
                  {
                     memcmp:{
                        offset:8,
                        bytes:authorPublicKey.toBase58(),
                     }
                  }
          ]);

      
      assert.equal(tweetAccounts.length,2);
      assert.ok(tweetAccounts.every(tweetAccount=>{
       return tweetAccount.account.author.toBase58()===authorPublicKey.toBase58()
      }));
      
    }); 

    it('can filter  tweets by topics', async () => {
 


      const tweetAccounts=await program.account.tweet.all(
          [
                  {
                     memcmp:{
                        offset:8+
                               32+
                               8+
                               4,
                      bytes:bs58.encode(Buffer.from('veganism')),
                     }
                  }
          ]);

      
      assert.equal(tweetAccounts.length,2);
      assert.ok(tweetAccounts.every(tweetAccount=>{
       return tweetAccount.account.topic==='veganism'
      }));
      
    }); 




});
