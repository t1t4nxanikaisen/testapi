const { GraphQLClient } = require('graphql-request');

const client = new GraphQLClient('https://graphql.anilist.co');

const fetchAnimeData = async (slug) => {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        episodes
      }
    }
  `;

  const variables = { search: slug };

  try {
    const data = await client.request(query, variables);
    return data.Media;
  } catch (error) {
    console.error('Anilist fetch error:', error);
    return null;
  }
};

module.exports = fetchAnimeData;
