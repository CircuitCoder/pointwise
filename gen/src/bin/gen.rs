use std::path::PathBuf;

use structopt::StructOpt;

#[derive(StructOpt)]
struct Args {
    /// Path to post directory
    #[structopt(short, long)]
    posts: PathBuf,
}

#[paw::main]
fn main(args: Args) -> anyhow::Result<()> {
    env_logger::init();

    log::info!("Loading posts from {}", args.posts.display());
    let posts = pointwise_gen::post::readdir(&args.posts)?;

    log::debug!("{:#?}", posts);

    Ok(())
}
