use std::collections::HashMap;

use pointwise_common::font::CharResp;
use serde::Serialize;

use crate::post::Post;

#[derive(Serialize, Clone)]
pub struct Entry<'a> {
    title_outline: &'a [CharResp],
    title: &'a str,
    url: &'a str,
    publish_time: &'a chrono::DateTime<chrono::FixedOffset>,
}

#[derive(Serialize)]
pub struct Tag<'a> {
    pub title: &'a str,
    entries: Vec<Entry<'a>>,
}

#[derive(Serialize, Clone)]
pub struct TagBrief<'a> {
    title: &'a str,
    cnt: usize,
    last_publish: &'a chrono::DateTime<chrono::FixedOffset>,
}

#[derive(Serialize)]
pub struct Taxonomy<'a> {
    tags: Vec<TagBrief<'a>>,
}

pub fn build_taxonomy<'a>(posts: &'a [Post]) -> (Vec<Tag<'a>>, Taxonomy) {
    // Implicit tag index
    let mut buckets = HashMap::new();
    buckets.insert("index", Vec::new());

    for post in posts {
        let entry = Entry {
            title_outline: &post.metadata.title_outline,
            title: &post.metadata.title,
            url: &post.metadata.url,
            publish_time: &post.metadata.publish_time,
        };

        buckets.get_mut("index").unwrap().push(entry.clone());
        for tag in &post.metadata.tags {
            buckets.entry(tag).or_insert(Vec::new()).push(entry.clone())
        }
    }

    let tags: Vec<_> = buckets.into_iter().map(|(k, v)| Tag {
        title: k,
        entries: v,
    }).collect();

    let taxonomy = Taxonomy {
        tags: tags.iter().map(|t| TagBrief {
            title: t.title,
            cnt: t.entries.len(),
            last_publish: t.entries[0].publish_time,
        }).collect(),
    };

    (tags, taxonomy)
}