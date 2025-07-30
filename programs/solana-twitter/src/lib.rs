use anchor_lang::prelude::*;

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("FUJ5sEpKL6FkYv7mqpaJY8pQfToMNner8iWAsVvr7nxx");

#[program]
mod hello_anchor {
    use super::*;
    pub fn send_tweet(ctx: Context<SendTweet>,topic:String,content:String) -> Result<()> {
         
     
        let tweet=&mut ctx.accounts.tweet;
        let author: &Signer = &ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap();

        if topic.chars().count()>50{
           
           return Err(ErrorCode::TopicTooLong.into());
        }

        if content.chars().count()>280{
            return Err(ErrorCode::ContentTooLong.into())
        }

        tweet.author=*author.key;
        tweet.timestamp=clock.unix_timestamp;
        tweet.topic=topic;
        tweet.content=content;
      
        Ok(())
    }

    pub fn update_tweet(ctx:Context<UpdateTweet>,topic:String,content:String)->Result<()>{
        
        let tweet=&mut ctx.accounts.tweet;

        if topic.chars().count()>50{
            return Err(ErrorCode::TopicTooLong.into());
        }

        if content.chars().count()>280{
           return Err(ErrorCode::ContentTooLong.into());
        }
              
        tweet.topic=topic;
        tweet.content=content;

         Ok(())
    }


    pub fn delete_tweet(ctx:Context<DeleteTweet>)->Result<()>{
        Ok(())
    }


}

#[derive(Accounts)]
pub struct SendTweet<'info> {
    // We must specify the space in order to initialize an account.
    // First 8 bytes are default account discriminator,
    // next 8 bytes come from NewAccount.data being type u64.
    // (u64 = 64 bits unsigned integer = 8 bytes)
    #[account(init, payer = author, space = Tweet::LEN)]
    pub tweet: Account<'info, Tweet>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateTweet<'info>{
   #[account(mut,has_one=author)]
   pub tweet:Account<'info,Tweet>,
   pub author:Signer<'info>,
}

#[derive(Accounts)]
pub struct DeleteTweet<'info>{
   #[account(mut,has_one=author,close=author)]
   pub tweet:Account<'info,Tweet>,
   pub author:Signer<'info>,
}

#[account]
pub struct Tweet{
    pub author:Pubkey,
    pub timestamp:i64,
    pub topic:String,
    pub content:String
}

const DISCRIMINATOR_LENGTH:usize=8;
const PUBLIC_KEY_LENGTH:usize=32;
const TIMESTAMP_LENGTH:usize=8;
const STRING_PREFIX_LENGTH:usize=4;
const MAX_TOPIC_LENGTH:usize=50*4;
const MAX_CONTENT_LENGTH:usize=280*4;

impl Tweet{
      const LEN: usize = DISCRIMINATOR_LENGTH
                         + PUBLIC_KEY_LENGTH // Author.
                         + TIMESTAMP_LENGTH // Timestamp.
                         + STRING_PREFIX_LENGTH + MAX_TOPIC_LENGTH // Topic.
                         + STRING_PREFIX_LENGTH + MAX_CONTENT_LENGTH; // Content.
}

#[error_code]
pub enum ErrorCode{
    #[msg("The provided topic should be 50 characters long maximum.")]
    TopicTooLong,
    #[msg("The provided content should be 280 characters long maximum.")]
    ContentTooLong,
}
