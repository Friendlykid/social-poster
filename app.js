//Obecný věci
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

const html = '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '\n' +
    '<head>\n' +
    '    <meta charset="utf-8">\n' +
    '    <meta http-equiv="X-UA-Compatible" content="IE=edge">\n' +
    '    <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '    <title>Imgur image upload</title>\n' +
    '    <link rel="stylesheet" href="https://esotemp.vse.cz/~kouj13/public_style/style.css?ts=<?=time()?>" />\n' +
    '    <link rel="icon" href="https://esotemp.vse.cz/~kouj13/public_style/favicon.ico" />\n' +
    '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">\n' +
    '</head>\n' +
    '\n' +
    '<body style="background: darkgrey">\n' +
    '    <h1>Social poster</h1>\n' +
    '    <h2>Choose on which social networks you want to upload your post</h2>\n' +
    '    <div class="checkboxes">\n' +
    '        <div class="checkboxClass">\n' +
    '            <i class=\'fa fa-twitter\' style=\'color: blue\' ></i>\n' +
    '            <label for="twitter">Twitter</label>\n' +
    '            <input type="checkbox" id="twitter" class="box">\n' +
    '        </div>\n' +
    '        <div class="checkboxClass" >\n' +
    '            <i class=\'fa fa-reddit\' style=\'color: red\'></i>\n' +
    '            <label for="reddit">Reddit</label>\n' +
    '            <input type="checkbox" id="reddit" class="box">\n' +
    '        </div>\n' +
    '        <div class="checkboxClass" >\n' +
    '            <img src="https://esotemp.vse.cz/~kouj13/public_style/imgur_logo.png" alt="logoImgur" style="height: 16px">\n' +
    '            <label for="imgur">Imgur</label>\n' +
    '            <input type="checkbox" id="imgur" class="box">\n' +
    '        </div>\n' +
    '\n' +
    '    </div>\n' +
    '    <div class="title" id="title">\n' +
    '        <h3>Headline</h3>\n' +
    '        <div class="center">\n' +
    '            <label for="textBoxTitle"></label>\n' +
    '            <input type="text" id="textBoxTitle" placeholder="Only for Reddit" class="textboxTitle" maxlength="300">\n' +
    '        </div>\n' +
    '    </div>\n' +
    '    <div class="subreddit" id="subreddit">\n' +
    '        <h3>Subreddit</h3>\n' +
    '        <div class="center">\n' +
    '            <label for="textBoxSubreddit"></label>\n' +
    '            <input type="text" id="textBoxSubreddit" placeholder="Only for Reddit" class="textboxTitle">\n' +
    '        </div>\n' +
    '    </div>\n' +
    '\n' +
    '    <h3>Text of post</h3>\n' +
    '    <div class="center">\n' +
    '        <label for="textBox"></label>\n' +
    '        <textarea id="textBox" placeholder="Write something..." class="textbox" style="resize: none;" maxlength="280"></textarea>\n' +
    '    </div>\n' +
    '    <label for="image" class="inputImage" id="imageLabel">Select Image</label>\n' +
    '    <input type="file" style="display: none" accept="image/*" id="image" placeholder="Image">\n' +
    '    <br>\n' +
    '    <button class="buttonUpload" id="buttonUpload" onclick="uploadPosts()">Upload</button>\n' +
    '    <div class="center" id="url">\n' +
    '        <p>Imgur link: <a id="imgurLink" style="visibility: hidden" target="_blank"></a></p>\n' +
    '        <p>Reddit link:<a id="redditLink" style="visibility: hidden" target="_blank"></a></p>\n' +
    '        <p>Twitter link:<a id="twitterLink" style="visibility: hidden" target="_blank"></a></p>\n' +
    '    </div>\n' +
    '    <script>\n' +
    '\n' +
    '        function imageInputClick(){\n' +
    '            if(document.getElementById(\'imgur\').checked || document.getElementById(\'twitter\').checked ){\n' +
    '                document.getElementById(\'imageLabel\').style.visibility = \'visible\';\n' +
    '            } else{\n' +
    '                document.getElementById(\'imageLabel\').style.visibility = \'hidden\';\n' +
    '                document.getElementById(\'image\').value = \'\';\n' +
    '            }\n' +
    '        }\n' +
    '        // klik na výběr\n' +
    '        document.querySelectorAll(".checkboxClass").forEach(checkboxContainer => {\n' +
    '            checkboxContainer.addEventListener(\'click\', (e) => {\n' +
    '                let box = checkboxContainer.getElementsByClassName("box")[0];\n' +
    '                box.checked = !box.checked;\n' +
    '                if(box.id === \'twitter\' || box.id === \'imgur\'){\n' +
    '                    imageInputClick();\n' +
    '                }\n' +
    '                if(box.checked){\n' +
    '                    checkboxContainer.style.backgroundColor = "#2d63c8";\n' +
    '                }\n' +
    '                else {\n' +
    '                    checkboxContainer.style.backgroundColor = "#ffffff";\n' +
    '                }\n' +
    '                //podmínky pro nadpis\n' +
    '                if(box.id === "reddit" && box.checked){\n' +
    '                    document.getElementById(\'title\').style.visibility = \'visible\';\n' +
    '                    document.getElementById(\'subreddit\').style.visibility = \'visible\';\n' +
    '                }\n' +
    '                if(box.id === "reddit" && !box.checked){\n' +
    '                    document.getElementById(\'title\').style.visibility = \'hidden\';\n' +
    '                    document.getElementById(\'subreddit\').style.visibility = \'hidden\';\n' +
    '                    document.getElementById(\'textBoxTitle\').value = "";\n' +
    '                    document.getElementById(\'textBoxSubreddit\').value = "";\n' +
    '                }\n' +
    '\n' +
    '                // je potřeba, jinak se event spouští dvakrát\n' +
    '                e.stopPropagation();\n' +
    '                e.preventDefault();\n' +
    '            })\n' +
    '        });\n' +
    '\n' +
    '        function fillFormData(formData) {\n' +
    '            if(document.getElementById(\'textBoxTitle\').value){\n' +
    '                formData.append(\'title\',document.getElementById(\'textBoxTitle\').value);\n' +
    '            }\n' +
    '            if(document.getElementById(\'textBoxSubreddit\').value){\n' +
    '                formData.append( \'subreddit\', document.getElementById(\'textBoxSubreddit\').value);\n' +
    '            }\n' +
    '            if(document.getElementById(\'textBox\').value){\n' +
    '                formData.append(\'textPost\', document.getElementById(\'textBox\').value);\n' +
    '            }\n' +
    '            if(document.getElementById(\'image\').files[0]){\n' +
    '                formData.append(\'image\',document.getElementById(\'image\').files[0]);\n' +
    '            }\n' +
    '        }\n' +
    '\n' +
    '        /**\n' +
    '         *\n' +
    '         * @returns true when no social Media is selected, otherwise false\n' +
    '         */\n' +
    '        function noSocialMediaIsChecked() {\n' +
    '            let res = true;\n' +
    '            document.querySelectorAll(".box").forEach( box =>{\n' +
    '                if(box.checked){\n' +
    '                    res = false;\n' +
    '                }\n' +
    '            });\n' +
    '            return res;\n' +
    '        }\n' +
    '\n' +
    '        //klik na upload\n' +
    '        function uploadPosts(){\n' +
    '            let formData = new FormData;\n' +
    '            document.querySelectorAll(".checkboxClass").forEach(checkboxContainer => {\n' +
    '                if(checkboxContainer.getElementsByClassName("box")[0].checked){\n' +
    '                    formData.append(\n' +
    '                        checkboxContainer.getElementsByClassName("box")[0].getAttribute("id"),\n' +
    '                        checkboxContainer.getElementsByClassName("box")[0].getAttribute("id")\n' +
    '                    );\n' +
    '                }\n' +
    '            })\n' +
    '            if(noSocialMediaIsChecked()){\n' +
    '                alert(\'You need to choose at least one social network!\');\n' +
    '            }else{\n' +
    '                fillFormData(formData);\n' +
    '                fetch(\'https://social-poster.onrender.com/submit-form\', {\n' +
    '                    method: \'POST\',\n' +
    '                    body: formData\n' +
    '                }).then(res => {\n' +
    '                    if(res.ok) {\n' +
    '                        return res.json();\n' +
    '                    }\n' +
    '                    else {\n' +
    '                        throw new Error(\'Server responded with status: \' + res.status);\n' +
    '                    }\n' +
    '                })\n' +
    '                    .then(data => {\n' +
    '                        console.log(data);\n' +
    '                        if(data.imgurLink){\n' +
    '                            document.getElementById(\'imgurLink\').style.visibility = \'visible\';\n' +
    '                            document.getElementById(\'imgurLink\').innerHTML = data.imgurLink;\n' +
    '                            document.getElementById(\'imgurLink\').href = data.imgurLink;\n' +
    '                        }\n' +
    '                        if(data.redditLink){\n' +
    '                            document.getElementById(\'redditLink\').style.visibility = \'visible\';\n' +
    '                            document.getElementById(\'redditLink\').innerHTML = data.redditLink;\n' +
    '                            document.getElementById(\'redditLink\').href = data.redditLink;\n' +
    '                        }\n' +
    '                        if(data.twitterLink){\n' +
    '                            document.getElementById(\'twitterLink\').style.visibility = \'visible\';\n' +
    '                            document.getElementById(\'twitterLink\').innerHTML = data.twitterLink;\n' +
    '                            document.getElementById(\'twitterLink\').href = data.twitterLink;\n' +
    '                        }\n' +
    '                    })\n' +
    '            }\n' +
    '\n' +
    '        }\n' +
    '    </script>\n' +
    '</body>\n' +
    '\n' +
    '</html>'
app.get("/", (req, res) => res.type('html').send(html));


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
    if (!req.body.textPost && !req.files) {
        return Promise.resolve(undefined);
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
        return new Promise((resolve, reject) => {
            T.post('statuses/update', {status: req.body.textPost}, function (err, data, response) {
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
            T.post('media/upload', { media_data: b64content }, function (err, data, response) {
                // now we can assign alt text to the media, for use by screen readers and
                // other text-based presentations and interpreters
                const mediaIdStr = data.media_id_string;
                const meta_params = {media_id: mediaIdStr, alt_text: {text: req.body.textPost}};
                T.post('media/metadata/create', meta_params, function (err, data, response) {
                    if (!err) {
                        // now we can reference the media and post a tweet (media will attach to the tweet)
                        const params = { status: req.body.textPost, media_ids: [mediaIdStr] }

                        T.post('statuses/update', params, function (err, data, response) {
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
    fs.unlinkSync(imagePath = __dirname + '/uploads/' + image.name);
}

/*  Jestli jsou sociální sítě vybrány pošle se jejich jméno do req.body.<NÁZEV SOCIÁLNÍ SÍTĚ>
    req.body.title je title příspěvku
    req.body.subreddit je jméno subreditu
    req.body.textPost je text příspěvku
    req.files.image je obrázek
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
