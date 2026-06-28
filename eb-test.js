const fetch = require('node-fetch');
async function test() {
    const res = await fetch('https://www.eventbriteapi.com/v3/users/me/organizations/', {
        headers: { 'Authorization': 'Bearer J6TUJ3UMQVNRAHTZDG5U' }
    });
    console.log(res.status, await res.text());
}
test();
