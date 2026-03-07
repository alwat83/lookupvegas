const now = new Date();
const end = Math.floor(now.getTime() / 1000);
const begin = end - (6 * 60 * 60);

fetch(`https://opensky-network.org/api/flights/arrival?airport=KLAS&begin=${begin}&end=${end}`)
    .then(res => {
        console.log(res.status);
        return res.text();
    })
    .then(text => console.log(text))
    .catch(err => console.error(err));
