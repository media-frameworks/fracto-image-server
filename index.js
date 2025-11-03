import express from "express";
import cors from "cors";
import fs from "fs";
import server from "./common/config/server.json" with {type: "json"};

import FractoIndexedTiles from "./fracto/FractoIndexedTiles.js";
import {handle_render_image} from "./render_image.js";
import {handle_tile_coverage} from "./tile_coverage.js";
import {initialize_coverage} from "./fracto/FractoCoverageUtils.js";
import {get_manifest} from "./fracto/FractoTileData.js";

let ready = false

const image_dir = "./images";
if (!fs.existsSync(image_dir)) {
   fs.mkdirSync(image_dir)
}
const thumbnails_dir = "./thumbnails";
if (!fs.existsSync(thumbnails_dir)) {
   fs.mkdirSync(thumbnails_dir)
}

const app = express();
const PORT = server.port

app.use(
   cors({
      origin: [
         'https://fracto.mikehallstudio.com:3000',
         'http://localhost:3000',
         'https://localhost:3000',
      ]
   })
);
app.use(express.json({limit: '500mb'}));

app.use((req, res, next) => {
   res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
   // Or specify a particular origin:
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Specify allowed methods
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With'); // Specify allowed headers
   next();
});

FractoIndexedTiles.init_tile_sets()

get_manifest((file) => {
   console.log(file.manifest_file);
}, () => {
   initialize_coverage(()=>{
      app.listen(PORT, () => console.log(`Server listening at port ${PORT}`));
   })
})

app.post("/render_image", handle_render_image)
app.get("/tile_coverage", handle_tile_coverage)
