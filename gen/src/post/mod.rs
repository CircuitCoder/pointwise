use std::{collections::HashMap, os::unix::prelude::OsStrExt, path::Path};

use chrono::TimeZone;
use git2::Sort;
use regex::Regex;

use crate::post::md::ParsedMarkdown;

mod md;

#[derive(Debug)]
pub struct Post {
    pub metadata: Metadata,
    pub html: String,
}

type DT = chrono::DateTime<chrono::FixedOffset>;

#[derive(Debug)]
pub struct Metadata {
    pub url: String,
    pub title: String,
    pub tags: Vec<String>,
    pub publish_time: DT,
    pub update_time: Option<DT>,
}

pub fn readdir<P: AsRef<Path>>(dir: P) -> anyhow::Result<Vec<Post>> {
    let entries = std::fs::read_dir(&dir)?;
    let mut pre: HashMap<String, (ParsedMarkdown, Option<DT>, Option<DT>)> = HashMap::new();

    for entry in entries {
        let entry = entry?;
        let file = std::fs::read_to_string(entry.path())?;
        let parsed = md::parse(&file)?;
        pre.insert(
            String::from_utf8(entry.file_name().as_bytes().to_vec())?.to_string(),
            (parsed, None, None),
        );
    }

    // Fetch history based on git repo
    let repo = git2::Repository::discover(&dir)?;
    log::debug!("Found repository at {}", repo.path().display());
    let mut revwalk = repo.revwalk()?;
    revwalk.set_sorting(Sort::TIME | Sort::TOPOLOGICAL | Sort::REVERSE)?;
    revwalk.reset()?;
    revwalk.push_head()?;

    let mut repodir = std::fs::canonicalize(repo.path())?;
    repodir.pop();

    let dir_abs = std::fs::canonicalize(dir.as_ref())?;
    let dir_rel = dir_abs.as_path().strip_prefix(&repodir)?;

    for oid in revwalk {
        let oid = oid?;
        log::debug!("Revwalk: {}", oid);
        let commit = repo.find_commit(oid)?;
        let time_raw = commit.time();
        let timezone = chrono::FixedOffset::east(time_raw.offset_minutes() * 60);
        let time = timezone
            .timestamp_opt(time_raw.seconds(), 0)
            .single()
            .ok_or_else(|| anyhow::anyhow!("Cannot parse time"))?;

        let base_tree = commit.tree()?;
        let dir_ent = match base_tree.get_path(dir_rel) {
            Err(_) => {
                // Not found, content is not in repo yet
                continue;
            }
            Ok(r) => r,
        };

        let dir_obj = dir_ent.to_object(&repo)?;
        let dir_tree = dir_obj
            .as_tree()
            .ok_or_else(|| anyhow::anyhow!("Unable to read as tree"))?;
        for content in dir_tree.iter() {
            let name = std::str::from_utf8(content.name_bytes())?;
            log::debug!("Walk at {}", name);
            let cached = pre.get_mut(name);
            if let Some((_, ref mut creation, ref mut update)) = cached {
                if update.is_none() {
                    *update = Some(time);
                }

                // TODO: asserts that if creation already exists, it cannot come before `time`
                *creation = Some(time);
            }
        }
    }

    let filename_re = Regex::new(r"\d{4}-\d{2}-\d{2}-(.*)\.md").unwrap();

    pre.into_iter()
        .map(
            |(filename, (pre, creation, update))| -> anyhow::Result<Post> {
                let creation = if let Some(c) = creation {
                    c
                } else {
                    return Err(anyhow::anyhow!("{} is not created?!", filename));
                };

                let update = if update == Some(creation) {
                    None
                } else {
                    update
                };

                let filename_match = filename_re
                    .captures(&filename)
                    .ok_or_else(|| anyhow::anyhow!("Unable to parse filename: {}", filename))?;
                let url = filename_match.get(0).unwrap().as_str();

                Ok(Post {
                    html: pre.html,
                    metadata: Metadata {
                        url: url.to_owned(),
                        title: pre.metadata.title,
                        tags: pre.metadata.tags,
                        publish_time: pre.metadata.force_publish_time.unwrap_or(creation),
                        update_time: pre.metadata.force_update_time.or(update),
                    },
                })
            },
        )
        .collect()
}
