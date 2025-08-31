import express from "express";
import cors from "cors";
import fs from "fs";
import {createCanvas} from "canvas";
import server from "./common/config/server.json" with {type: "json"};

import {
   get_manifest,
   init_canvas_buffer,
   fill_canvas_buffer,
} from "./fracto/FractoTileData.js"

const app = express();
const PORT = server.port

app.use(express.json({limit: '50mb'}));

app.use(cors({
   origin: "*"
}));

let load_completed = false
get_manifest(
   (update_json) => {
      console.log(`[${update_json.packet_index + 1}/${update_json.packet_count}]: ${update_json.manifest_file}`);
   },
   (complete_msg) => {
      console.log(complete_msg);
      load_completed = true
      app.listen(PORT, () => console.log(`Server listening at port ${PORT}`));
   },
)

// test with:
// http://localhost:3005/render_image?re=-1.255429537592117&im=0.05058453422756254&scope=0.0932&aspect_ratio=1.0&width_px=500
app.get("/render_image", (req, res) => {
   if (!load_completed) {
      console.log('cannot render until load completed')
      return
   }
   console.log('render_image params', JSON.stringify(req.query))
   const focal_point = {
      x: parseFloat(req.query.re),
      y: parseFloat(req.query.im),
   }
   const width_px = parseInt(req.query.width_px, 10)
   const aspect_ratio = parseFloat(req.query.aspect_ratio, 10)
   const height_px = width_px * aspect_ratio
   const scope = parseFloat(req.query.scope, 10)
   const canvas_buffer = init_canvas_buffer(
      width_px,
      aspect_ratio
   )
   const canvas = createCanvas(width_px, height_px);
   const ctx = canvas.getContext('2d');
   console.log('ctx', ctx)
   fill_canvas_buffer(
      canvas_buffer,
      ctx,
      width_px,
      focal_point,
      scope,
      aspect_ratio
   )
   const buffer = canvas.toBuffer('image/jpeg');
   fs.writeFileSync('./output.jpg', buffer); // Saves as output.png
   console.log('Image saved successfully!');
});