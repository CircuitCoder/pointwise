mod config;
mod web;

use std::collections::HashMap;
use std::fs::File;
use std::path::PathBuf;

use actix_web::{App, HttpServer};
use std::io::Read;
use structopt::StructOpt;
use url::Host;

#[derive(StructOpt)]
struct Args {
    /// Path to config file
    config: PathBuf,
}

#[paw::main]
#[actix_web::main]
async fn main(args: Args) -> anyhow::Result<()> {
    env_logger::init();

    let config_file = std::fs::File::open(args.config)?;
    let config: config::Config = serde_yaml::from_reader(config_file)?;

    log::debug!("{:#?}", config);

    let mut fonts: HashMap<String, ttf_parser::Face<'static>> = HashMap::new();

    for (name, path) in config.fonts {
        log::info!("Loading font '{}' from {}", name, path.display());
        let mut font_file = File::open(path)?;
        let mut font_buf = Vec::new();
        font_file.read_to_end(&mut font_buf)?;
        let font_slice = font_buf.leak();
        let font: ttf_parser::Face<'static> = ttf_parser::Face::from_slice(font_slice, 0)?;
        fonts.insert(name, font);
    }

    let state = actix_web::web::Data::new(web::State::new(fonts));

    let server = HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .wrap(actix_web::middleware::Logger::default())
            .service(web::render)
            .service(web::list)
    });

    let server = match config.bind.scheme() {
        "unix" => server.bind_uds(config.bind.path()),
        "tcp" => {
            let port = config.bind.port().unwrap_or(9487);
            match config.bind.host() {
                Some(Host::Ipv4(ip)) => server.bind((ip, port)),
                Some(Host::Ipv6(ip)) => server.bind((ip, port)),
                Some(Host::Domain(domain)) => server.bind((domain, port)),
                _ => return Err(anyhow::anyhow!("TCP listen should be in form of IP[:port]")),
            }
        }
        s => return Err(anyhow::anyhow!("Unknown scheme: {}", s)),
    };

    server?.run().await?;

    Ok(())
}
