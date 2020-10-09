export const AICS_CELL_URL =
  "https://s3-us-west-2.amazonaws.com/bisque.allencell.org/v1.4.0/Cell-Viewer_Thumbnails/AICS-11";
export const AICS_CELL_ID = "AICS-11_3136";

const fetchAtlasJson = async () => {
  const response = await fetch( `${ AICS_CELL_URL }/${ AICS_CELL_ID }_atlas.json` )

  const atlasJson = await response.json()

  atlasJson.images = atlasJson.images.map( ( img ) => ( {
    ...img,
    name: `${ AICS_CELL_URL }/${ img.name }`,
  } ) );

  return atlasJson;
}

export { fetchAtlasJson }
