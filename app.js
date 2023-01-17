//Obecný věci
const fs = require('fs');
const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
require('dotenv').config();
let image;
let imagePath;

//Imgur věci
const { ImgurClient } = require('imgur');
const client = new ImgurClient({ clientId: process.env.IMGUR_CLIENT_ID });
let imgurImageLink;




app.use(fileUpload());

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', (req, res) => {
    res.render('index.ejs');
});

/**
 * původní kód z yt. Po dokončení můžeš smazat
 */
app.post('/upload', (req,res)=>{
    if(!req.files){
        return res.status(400).send('No files were uploaded');
    }

    let sampleFile = req.files.sampleFile;
    let uploadPath = __dirname + '/uploads/' + sampleFile.name;
    sampleFile.mv(uploadPath, function (err) {
        if (err) {
            return res.status(500).send(err);
        }
        client.upload({
            image: fs.createReadStream(uploadPath),
            type: "stream"
        }).then((response) => {
            fs.unlinkSync(uploadPath);
            imgurImageLink = response.data.link;
            res.render('uploaded.ejs', {link: response.data.link});
            console.log(response.data.link);

        })

    }).then()
});

/**
 *
 * @param req request of the user
 * @returns Promise: when succesfull link to Imgur of the image, either undefined
 */
async function promiseImgur(req) {
    if(req.body.imgur && !req.files  ){
        return Promise.reject(new Error('The user did not entered a file'));
    }
    if(!req.body.imgur){
        return Promise.resolve(undefined);
    }
    return new Promise((resolve, reject) => {
        image = req.files.image;
        imagePath = __dirname + '/uploads/' + image.name;
        image.mv(imagePath, async function (err) {
            if (err) {
                return reject(err);
            }
            try {
                const response = await client.upload({
                    image: fs.createReadStream(imagePath),
                    type: "stream"
                });
                fs.unlinkSync(imagePath);
                console.log('Imgur link: '+response.data.link)
                resolve(response.data.link);
            } catch (error) {
                reject(error);
            }
        });
    });
}

/**
 * edits piece of link to full internet link
 * @param link string: identifying piece of link
 * @param subreddit string: name of subreddit
 * @returns {string} full link to reddit post
 */
function createRedditLink(link, subreddit) {
    return 'https://www.reddit.com/r/'.concat(subreddit+'/comments/'+link.slice(3,link.length));
}

/**
 * Uploads post to subreddit
 * @param req request of the user
 * @returns Object r is a piece of link to the reddit post
 */
async function promiseReddit(req) {
    const snoowrap = require('snoowrap');

    if (!req.body.reddit) {
        return Promise.resolve(undefined);
    }
    if (!req.body.title) {
        return Promise.reject(new Error('The user did not entered a title'));
    }
    const r = new snoowrap({
        userAgent: 'put your user-agent string here',
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        refreshToken: process.env.REDDIT_REFRESH_TOKEN
    });
    return new Promise((resolve, reject)=>{
        r.submitSelfpost({
            subredditName: req.body.subreddit,
            title: req.body.title,
            text: req.body.textPost
        }).then((r) =>{
            console.log('Reddit link: '+createRedditLink(r.name,req.body.subreddit));
            resolve(createRedditLink(r.name,req.body.subreddit));
        }).catch((err) =>{
            reject(err);
        })
    })
}

/**
 *
 * @param id identifying piece of link
 * @returns {string} full link to tweet
 */
function createTwitterLink(id){
    return 'https://twitter.com/4iz268sem_prace/status/'+ id;
}
/**
 *
 * @param req request of the user
 * @returns Promise link to tweet
 */
async function promiseTwitter(req){

    if (!req.body.twitter) {
        return Promise.resolve(undefined);
    }
    if (!req.body.textPost) {
        return Promise.resolve(undefined);
    }
    let myHeaders = new Headers();
    myHeaders.append("Authorization", 'OAuth oauth_consumer_key="'
        + process.env.TWITTER_API_KEY + '",oauth_token="'
        + process.env.TWITTER_ACCESS_TOKEN + '",oauth_signature_method="HMAC-SHA1",oauth_timestamp="1673884596",oauth_nonce="fl8ncgGvl3e",oauth_version="1.0",oauth_signature="9Ur35X%2Fenk46SUnWP3DQHNiQmfE%3D    "');
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Cookie", "guest_id=v1%3A167388459685919437");
    let raw = JSON.stringify({
        "text": req.body.textPost
    });

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };
    return await fetch("https://api.twitter.com/2/tweets", requestOptions)
        .then(response => response.text())
        .then(response => {
            let jsonResponse = JSON.parse(response);
            console.log('Twitter link: '+createTwitterLink(jsonResponse.data.id));
            return createTwitterLink(jsonResponse.data.id);
        })
        .catch(error => console.log('error', error));
}

async function promiseInstagram(req) {

}

/*  Jestli jsou sociální sítě vybrány pošle se jejich jméno do req.body.<NÁZEV SOCIÁLNÍ SÍTĚ>
    req.body.title je title příspěvku
    req.body.subreddit je jméno subreditu
    req.body.textPost je text příspěvku
    req.files.image je obrázek
*/
app.post('/submit-form', (req,res) => {
    //TODO when finished remove comment
    Promise.all([promiseImgur(req),promiseReddit(req), promiseTwitter(req)/*, promiseInstagram(req)*/])
        .then(([imgurData, redditData, TwitterData, instagramData]) =>{
            //TODO
        })
    if(!req.files){
        return res.status(400).send('Nothing was uploaded');
    }

    image = req.files.image;
    imagePath = __dirname + '/uploads/' + image.name;
    image.mv(imagePath, function(err) {
        if (err) {
            return res.status(500).send(err);
        }
        if(req.body.imgur){
            client.upload({
                image: fs.createReadStream(imagePath),
                type: "stream"
            }).then((response) => {
                //TODO upravit
                fs.unlinkSync(imagePath);
                res.render('uploaded.ejs', {link: response.data.link});
                console.log(response.data.link);

            }).then(()=>{
            })
        }

        res.send('File uploaded to ' + imagePath);
        console.log('File uploaded to ' + imagePath);
    });

})

app.listen(3000, ()=>{
    console.log('Server started on port 3000');
});
