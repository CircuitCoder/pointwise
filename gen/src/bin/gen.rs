use std::{fs::File, io::Read, path::PathBuf};

use structopt::StructOpt;

#[derive(StructOpt)]
struct Args {
    /// Path to post directory
    #[structopt(short, long)]
    posts: PathBuf,

    /// Path to font file used for title outlining
    #[structopt(short, long)]
    title_font: PathBuf,

    /// Output path
    #[structopt(short, long, default_value="out")]
    output: PathBuf,
}

#[paw::main]
fn main(args: Args) -> anyhow::Result<()> {
    env_logger::init();

    log::info!("Loading font from {}", args.title_font.display());
    let mut font_file = File::open(args.title_font)?;
    let mut font_buf = Vec::new();
    font_file.read_to_end(&mut font_buf)?;
    let font: ttf_parser::Face = ttf_parser::Face::from_slice(font_buf.as_slice(), 0)?;
    // TODO: font wght

    log::info!("Loading posts from {}", args.posts.display());
    let posts = pointwise_gen::post::readdir(&args.posts, &font)?;

    let (tags, taxonomy) = pointwise_gen::taxonomy::build_taxonomy(posts.as_slice());

    log::debug!("Writing to: {:#?}", args.output);
    std::fs::create_dir_all(&args.output)?;

    // Write taxonomy
    let taxonomy_file = std::fs::File::create(args.output.join("taxonomy.json"))?;
    serde_json::to_writer(taxonomy_file, &taxonomy)?;

    // Write tags
    let tag_base = args.output.join("lists");
    std::fs::create_dir(&tag_base)?;
    for list in tags {
        let tag_file = std::fs::File::create(tag_base.join(format!("{}.json", list.title)))?;
        serde_json::to_writer(tag_file, &list)?;
    }

    // Write posts
    let posts_base = args.output.join("posts");
    std::fs::create_dir(&posts_base)?;
    for post in posts {
        let tag_file = std::fs::File::create(posts_base.join(format!("{}.json", post.metadata.url)))?;
        serde_json::to_writer(tag_file, &post)?;
    }

    Ok(())
}
