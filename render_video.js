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

export const handle_video_start = async (req, res) => {
   const result = {'started': true};
   res.status(200).send(result);
}

export const handle_video_frame = async (req, res) => {
   const result = {'started': true};
   res.status(200).send(result);
}

export const handle_video_end = async (req, res) => {
   const result = {'started': true};
   res.status(200).send(result);
}