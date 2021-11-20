// TODO: export Taxonomy and other stuff

import taxonomyPath from './compiled/taxonomy.json.packed';
export const taxonomy = download(taxonomyPath);

async function download(url: string) {
  const resp = await fetch(url);
  return await resp.json();
}