import fs from "fs";
import {execSync} from "child_process";
import {exiftool} from "exiftool-vendored";
import {createCanvas} from "canvas";

import FractoColors from "./fracto/FractoColors.js";
import FractoTileCache from "./fracto/FractoTileCache.js";
import {
   fill_canvas_buffer,
   init_canvas_buffer
} from "./fracto/FractoTileData.js";

export const handle_render_image = async (req, res) => {
   const width_px = parseInt(req.query.width_px, 10)
   const aspect_ratio = parseFloat(req.query.aspect_ratio, 10)
   const height_px = width_px * aspect_ratio
   const scope = parseFloat(req.query.scope, 10)
   const focal_point = {
      x: parseFloat(req.query.re),
      y: parseFloat(req.query.im),
   }
   const time_1 = performance.now()
   const collection = req.query.collection || "images";
   const artist_email = req.query.artist_email || "unknown artist email";
   const artist_name = req.query.artist_name || "unknown artist name";
   const created = parseInt(req.query.created, 10)

   console.log('render_image', width_px)

   const canvas_buffer = init_canvas_buffer(width_px, 1.0);
   await fill_canvas_buffer(
      canvas_buffer,
      width_px,
      focal_point,
      scope, 1.0,
   )
   FractoTileCache.trim_cache()

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
      asset_id: random_name,
      width_px,
      height_px,
      aspect_ratio,
      focal_point,
      scope,
      filename,
      artist_name,
      artist_email,
      created,
      public_url: `https://mikehallstudio.s3.us-east-1.amazonaws.com/fracto/${collection}/${filename}`,
   }

   try {
      await exiftool.write(filePath, {
         Title: 'Fracto Image Capture',
         Artist: `${artist_name} (${artist_email})`,
         Copyright: '(c) 2025 Fracto Chaotic Systems Group',
         DateTimeOriginal: created,
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
}
