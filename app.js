const fs = require('fs');
const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
require('dotenv').config();
require('ejs')
let image;
let imagePath;

app.use(fileUpload());

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const file = fs.readFileSync('views/index.ejs', 'ascii');
app.get("/", (req, res) => res.type('html').send(file));


/**
 *
 * @param req request of the user
 * @returns Promise: when succesfull link to Imgur of the image, either undefined
 */
async function promiseImgur(req) {
    const { ImgurClient } = require('imgur');

    const client = new ImgurClient({ clientId: process.env.IMGUR_CLIENT_ID });

    if(req.body.imgur && !req.files  ){
        console.log('The user did not entered a file');
        return Promise.resolve('The user did not entered a file');
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
        return Promise.resolve('The user did not entered a title');
    }
    const r = new snoowrap({
        userAgent: 'put your user-agent string here',
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        refreshToken: process.env.REDDIT_REFRESH_TOKEN
    });
    let check;
    return new Promise((resolve)=>{
        r.submitSelfpost({
            subredditName: req.body.subreddit,
            title: req.body.title,
            text: req.body.textPost
        }).catch(() =>{
            check = true;
        }).then((r) =>{
            if(check){
                resolve('Invalid subreddit');
            }else{
                console.log('Reddit link: '+createRedditLink(r.name,req.body.subreddit));
                resolve(createRedditLink(r.name,req.body.subreddit));
            }
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
    if (!req.body.textPost && !req.files) {
        return Promise.resolve(undefined);
    }
    if (!req.body.textPost && req.files) {
        return Promise.resolve('You have to enter a text');
    }
    const Twit = require('twit');
    const T = new Twit({
        consumer_key:         process.env.TWITTER_API_KEY,
        consumer_secret:      process.env.TWITTER_KEY_SECRET,
        access_token:         process.env.TWITTER_ACCESS_TOKEN,
        access_token_secret:  process.env.TWITTER_TOKEN_SECRET,
        timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
        strictSSL:            true,     // optional - requires SSL certificates to be valid.
    })

    if(!req.files) {
        return new Promise((resolve) => {
            T.post('statuses/update', {status: req.body.textPost}, function (err, data) {
                console.log(createTwitterLink(data.id_str));
                resolve(createTwitterLink(data.id_str));
            });
        })
    }
    //At this point we know that the user wants to post an image with a text
    return new Promise((resolve, reject) =>{
        image = req.files.image;
        imagePath = __dirname + '/uploads/' + image.name;
        image.mv(imagePath, async function (err) {
            if (err) {
                console.log(err);
                return reject(err);
            }
            const b64content = fs.readFileSync(imagePath, { encoding: 'base64' });
            // first we must post the media to Twitter
            T.post('media/upload', { media_data: b64content }, function (err, data) {
                // now we can assign alt text to the media, for use by screen readers and
                // other text-based presentations and interpreters
                const mediaIdStr = data.media_id_string;
                const meta_params = {media_id: mediaIdStr, alt_text: {text: req.body.textPost}};
                T.post('media/metadata/create', meta_params, function (err) {
                    if (!err) {
                        // now we can reference the media and post a tweet (media will attach to the tweet)
                        let status = req.body.textPost;
                        if(!req.body.textPost)
                            status = ' ';
                        const params = { status: status, media_ids: [mediaIdStr] }

                        T.post('statuses/update', params, function (err, data) {
                            console.log(createTwitterLink(data.id_str));
                            resolve(createTwitterLink(data.id_str));
                        })
                    }
                })
            })
        })
    })
}

function deleteImageFromServer(image) {
    try{
        fs.unlinkSync(imagePath = __dirname + '/uploads/' + image.name);
    }catch (e){
        console.log(e);
    }

}

/*  If is website chosen its name will appear in req.body.<NAME OF WEBSITE>
    req.body.title is title
    req.body.subreddit is name of subreddit
    req.body.textPost is text
    req.files.image is image
*/
app.post('/submit-form', (req,res) => {
    Promise.all([promiseImgur(req),promiseReddit(req), promiseTwitter(req)])
        .then(([imgurData, redditData, twitterData]) =>{
            if(req.files){
                deleteImageFromServer(req.files.image);
            }
            let body = {};
            if(twitterData)
                body.twitterLink = twitterData;
            if(redditData)
                body.redditLink = redditData;
            if(imgurData)
                body.imgurLink = imgurData;
            console.log(body);
            res.send(body);
        })
});

app.listen(3000, ()=>{
    console.log('Server started on port 3000');
});