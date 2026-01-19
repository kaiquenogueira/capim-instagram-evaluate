
const axios = require('axios');
const handle = 'capim.br';
const apiKey = "MkXHS8ggDDScD5VQJW73IwHKb403";

async function inspectData() {
  try {
    const response = await axios.get(`https://api.scrapecreators.com/v1/instagram/profile?handle=${handle}`, {
      headers: { "x-api-key": apiKey }
    });
    
    const root = response.data;
    const user = root.data?.user; // Adjusted based on previous log
    
    if (user) {
        console.log('User keys:', Object.keys(user));
        console.log('Profile Pic URL:', user.profile_pic_url);
        console.log('Profile Pic URL HD:', user.profile_pic_url_hd);
        console.log('Followers:', user.edge_followed_by?.count);
        console.log('Following:', user.edge_follow?.count);
        console.log('Posts:', user.edge_owner_to_timeline_media?.count);
        console.log('Bio:', user.biography);
        console.log('Full Name:', user.full_name);
    } else {
        console.log('User object not found in data');
        console.log('Data structure:', JSON.stringify(root.data, null, 2));
    }

  } catch (error) {
    console.error(error);
  }
}

inspectData();
