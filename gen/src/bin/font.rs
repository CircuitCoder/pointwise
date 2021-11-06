use std::{fs::File, io::Read, path::PathBuf};

use structopt::StructOpt;

#[derive(StructOpt)]
struct Args {
    /// Path to config file
    #[structopt(short, long)]
    font: PathBuf,
}

#[paw::main]
fn main(args: Args) -> anyhow::Result<()> {
    env_logger::init();

    log::info!("Loading font from {}", args.font.display());
    let mut font_file = File::open(args.font)?;
    let mut font_buf = Vec::new();
    font_file.read_to_end(&mut font_buf)?;
    let font: ttf_parser::Face = ttf_parser::Face::from_slice(font_buf.as_slice(), 0)?;

    let stdin = std::io::stdin();
    let mut input = String::new();
    while stdin.read_line(&mut input).is_ok() {
        let converted: anyhow::Result<Vec<_>> = input.trim().chars().map(|c| pointwise_gen::font::parse_char(c, &font)).collect();
        let converted = converted?;
        println!("{}", serde_json::to_string_pretty(&converted)?);
    }

    Ok(())
}