// TODO: export Taxonomy and other stuff

import taxonomyPath from './compiled/taxonomy.json.packed';

export const taxonomy = download(taxonomyPath);

async function download(url: string) {
  const resp = await fetch(url);
  return await resp.json();
}

const postCtx = require.context('./compiled/posts', true, /\.json.packed$/);
const postKeys = postCtx.keys();
export async function downloadPost(id: string) {
  if(postKeys.includes(`./${id}.json.packed`)) return await download(postCtx(`./${id}.json.packed`).default);
  return null;
}