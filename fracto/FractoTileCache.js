import network from "../common/config/network.json" with {type: 'json'}
import server from "../common/config/server.json" with {type: 'json'}
import {Buffer} from "buffer";
import axios from "axios";
import zlib from "zlib";
import fs from "fs";

export var CACHED_TILES = {}

setInterval(() => {
   FractoTileCache.trim_cache()
}, 10000)

const CACHE_TIMEOUT = 5 * 1000 * 60;
const QUICK_CACHE_TIMEOUT = 2 * 1000 * 60;
const MIN_CACHE = 250
const MAX_CACHE = 750

const AXIOS_CONFIG = {
   responseType: 'arraybuffer',
   headers: {
      'Content-Type': 'arraybuffer',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Access-Control-*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,PATCH,OPTIONS',
   },
   mode: 'no-cors',
   crossdomain: true,
}

export class FractoTileCache {

   static error_count = 0;

   static get_tile_url = async (remote_path) => {
      try {
         let arrayBuffer = []
         if (server.env !== 'local') {
            const url = `${network["fracto-prod"]}/${remote_path}`
            const response = await axios.get(url, AXIOS_CONFIG);
            const blob = new Blob([response.data], {type: 'application/gzip'});
            arrayBuffer = await blob.arrayBuffer();
         } else {
            const file_path = `${network["tiles_path"]}/${remote_path}`
            const file_data = fs.readFileSync(file_path);
            arrayBuffer = Buffer.from(file_data, 'utf8');
            // console.log('tiles_path', file_path)
         }
         const decompressed = zlib.gunzipSync(arrayBuffer);
         const ascii = Buffer.from(decompressed, 'ascii');
         return JSON.parse(ascii.toString());
      } catch (error) {
         console.log('get_tile_url error', error.message);
         return null
      }
   }

   static get_tile = async (short_code) => {
      if (CACHED_TILES[short_code]) {
         CACHED_TILES[short_code].last_access = Date.now()
         CACHED_TILES[short_code].access_count++
         return CACHED_TILES[short_code].uncompressed;
      }
      if (FractoTileCache.error_count > 100) {
         console.log('get_tile_url error_count > 100')
         return null;
      }
      const level = short_code.length
      const naught = level < 10 ? '0' : ''
      const remote_path = `L${naught}${level}/${short_code}.gz`
      try {
         const uncompressed = FractoTileCache.get_tile_url(remote_path)
         if (uncompressed) {
            CACHED_TILES[short_code] = {
               uncompressed: uncompressed,
               last_access: Date.now(),
               access_count: 1,
            }
         } else {
            console.log('failed to decompress');
         }
         return uncompressed
      } catch (e) {
         console.log(`get_tile error ${short_code}`, e.message)
         FractoTileCache.error_count++
         return null
      }
   }

   static trim_cache(extra_ms = 0) {
      const short_codes = Object.keys(CACHED_TILES)
      if (short_codes.length < MIN_CACHE) {
         return;
      }
      const timeout = short_codes.length > MAX_CACHE
         ? QUICK_CACHE_TIMEOUT
         : CACHE_TIMEOUT
      let delete_count = 0
      short_codes.forEach((short_code) => {
         if (CACHED_TILES[short_code].last_access < Date.now() - timeout + extra_ms) {
            // console.log(`deleting ${short_code} from cache`)
            delete_count++
            delete CACHED_TILES[short_code]
         }
      })
      if (delete_count > 1) {
         console.log(`trim_cache deleted: ${delete_count} from ${short_codes.length}`)
      }
   }
}

export default FractoTileCache