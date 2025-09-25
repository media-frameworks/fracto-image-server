import express from "express";
import cors from "cors";
import fs from "fs";
import {createCanvas} from "canvas";
import server from "./common/config/server.json" with {type: "json"};
import aws from "./common/config/aws.json" with {type: "json"};
import {exiftool} from "exiftool-vendored";
import {execSync} from "child_process";

import AWS from 'aws-sdk'

var accessKeyId = aws.accessKeyId;
var secretAccessKey = aws.secretAccessKey;
AWS.config.update({
   accessKeyId: accessKeyId,
   secretAccessKey: secretAccessKey
});
var s3 = new AWS.S3();

const image_dir = "./images";
if (!fs.existsSync(image_dir)) {
   fs.mkdirSync(image_dir)
}
const thumbnails_dir = "./thumbnails";
if (!fs.existsSync(thumbnails_dir)) {
   fs.mkdirSync(thumbnails_dir)
}

// import {
//    get_manifest,
//    init_canvas_buffer,
//    fill_canvas_buffer,
// } from "./fracto/FractoTileData.js"
import FractoColors from "./fracto/FractoColors.js";

const app = express();
const PORT = server.port

app.use(express.json({limit: '500mb'}));

app.use(cors({
   origin: "*"
}));

app.listen(PORT, () => console.log(`Server listening at port ${PORT}`));

// post version
app.post("/render_image", async (req, res) => {
   const width_px = parseInt(req.query.width_px, 10)
   const aspect_ratio = parseFloat(req.query.aspect_ratio, 10)
   const height_px = width_px * aspect_ratio
   const scope = parseFloat(req.query.scope, 10)
   const focal_point = {
      x: parseFloat(req.query.re),
      y: parseFloat(req.query.im),
   }
   const canvas_buffer = req.body// JSON.parse(req.body);
   const time_1 = performance.now()
   const collection = req.query.collection || "images";

   console.log('render_image', width_px)

   const canvas = createCanvas(width_px, height_px);
   const ctx = canvas.getContext('2d');
   FractoColors.buffer_to_canvas(canvas_buffer, ctx)
   const time_2 = performance.now()

   const random_name = `img_${Math.round(Math.random() * 100000000)}`
   const filename = `${random_name}.jpg`
   const filePath = `./${collection}/${filename}`
   try {
      const buffer = canvas.toBuffer('image/jpeg');
      fs.writeFileSync(filePath, buffer); // Saves as output.png
      console.log('Image saved successfully!');
   } catch (e) {
      console.log('error writing file', e.message)
   }
   const time_3 = performance.now()

   const result = {
      width_px,
      height_px,
      aspect_ratio,
      focal_point,
      scope,
      filename,
      public_url: `https://mikehallstudio.s3.us-east-1.amazonaws.com/fracto/${collection}/${filename}`,
   }

   try {
      await exiftool.write(filePath, {
         Title: 'Your Title Here',
         Artist: 'Your Name Here',
         Copyright: '(c) 2025 Fracto Chaotic Systems Group',
         DateTimeOriginal: new Date().toISOString(),
         Subject: 'fractals,math,art,mandelbrot',
         'XMP:Subject': 'fractals,math,art,mandelbrot',
         Software: JSON.stringify(result),
         'XMP:Description': JSON.stringify(result),
      });
      console.log('EXIF data added successfully!');
   } catch (err) {
      console.error('Error adding EXIF data:', err);
   }
   const time_4 = performance.now()

   try {
      const cmd = `aws s3 cp ${filePath} s3://mikehallstudio/fracto/${collection}/ --acl public-read`
      console.log('uploading to s3', cmd)
      execSync(cmd)
      console.log('upload completed')
   } catch (e) {
      console.log('Error uploading to s3', e.message);
   }
   const time_5 = performance.now()

   result.performance = {
      buffer_to_canvas: `${time_2 - time_1}`,
      writeFileSync: `${time_3 - time_2}`,
      exiftool: `${time_4 - time_3}`,
      s3_upload: `${time_5 - time_4}`,
      total: `${time_5 - time_1}`,
   }
   console.log('result', result)
   res.status(200).send(result);

})
