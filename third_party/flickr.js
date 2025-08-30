const axios = require("axios");
const fs = require("fs");
const Flickr = require("flickr-sdk");
const flickr_keys = require('./admin/flickr.json')

var oauth = new Flickr.OAuth(
   flickr_keys.Key,
   flickr_keys.Secret
);
console.log("flickr oauth", oauth)
const PHOTOSET_ID = '72177720308427601'

var oauth_verifier = null
var oauth_token = null
var oauth_token_secret = null

export const get_access = (req, result) => {
   if (oauth_verifier) {
      result.send({
         oauth_verifier: oauth_verifier,
         oauth_token: oauth_token,
         oauth_token_secret: oauth_token_secret
      })
   } else {
      oauth.request(`http://localhost:${PORT}/oauth/callback`).then(function (res) {
         console.log('oauth request succeeded', res.body);
         var url = oauth.authorizeUrl(res.body.oauth_token, "write"); // "https://www.flickr.com/services/oauth..."
         console.log("access requested, returns:", url)
         oauth_token_secret = res.body.oauth_token_secret
         result.send({
            url: url,
            api_key: flickr_keys.Key,
            api_secret: flickr_keys.Secret,
            oauth_token: res.body.oauth_token,
            oauth_token_secret: res.body.oauth_token_secret
         });
      }).catch(function (err) {
         console.error('bonk', err);
      });
   }
}

export const get_callback =  (req, res) => {
   console.log("/oauth/callback!!!", req.query)
   const requestToken = req.query.code;
   if (requestToken) {
      axios({
         method: "get",
         url: `https://www.flickr.com/services/oauth/request_token?client_id=${flickr_keys.Key}&client_secret=${flickr_keys.Secret}&code=${requestToken}`,
         headers: {accept: "application/json",},
      }).then((response) => {
         const accessToken = response.data.access_token;
         console.log("accessToken", accessToken)
      });
   }
   if (req.query.oauth_verifier) {
      oauth_verifier = req.query.oauth_verifier
      oauth_token = req.query.oauth_token
   }
}

export const post_upload =   (req, result) => {

   const img = req.body.file;
   var regex = /^data:.+\/(.+);base64,(.*)$/;
   const img_name = req.body.name;
   console.log("uploading file, stand by...", img_name)

   var matches = img.match(regex);
   var ext = matches[1];
   var data = matches[2];
   var buffer = Buffer.from(data, 'base64');

   const filename = `./tile-images/${img_name}.${ext}`
   console.log("saving file", filename)
   fs.writeFileSync(filename, buffer);

   oauth.verify(oauth_token, oauth_verifier, oauth_token_secret).then(function (res) {
      console.log('oauth token:', res.body.oauth_token);
      console.log('oauth token secret:', res.body.oauth_token_secret);

      const access_oauth = Flickr.OAuth.createPlugin(
         flickr_keys.Key,
         flickr_keys.Secret,
         res.body.oauth_token,
         res.body.oauth_token_secret
      )
      const level = req.body.name.length
      var upload = new Flickr.Upload(access_oauth, filename, {
         title: `${img_name}`,
         description: `Level ${level} tile rendering`,
         tags: `fracto level-${level}`,
         is_public: true
      });
      upload.then(function (res) {
         const photo_id = res.body.photoid._content
         console.log('new photoid:', photo_id);
         const flickr = new Flickr(access_oauth);
         const params = {
            api_key: flickr_keys.Key,
            photoset_id: PHOTOSET_ID,
            photo_id: photo_id
         }
         console.log("params", params)
         flickr.photosets.addPhoto(params)
            .catch(function (err) {
               console.log('bonk flickr.photosets.addPhoto', err);
            });
         result.send(photo_id)
      }).catch(function (err) {
         console.error('bonk upload', err);
      });

   }).catch(function (err) {
      console.log('bonk oauth.verify', err);
   });

}