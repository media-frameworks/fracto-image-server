import axios from "axios";
import {Buffer} from "buffer";
import FractoIndexedTiles, {TILE_SET_INDEXED} from "./FractoIndexedTiles.js";
import network from "./../common/config/network.json" with {type: "json"};
import FractoFastCalc from "./FractoFastCalc.js";
import FractoTileCache from "./FractoTileCache.js";

var BAD_TILES = {};

const FRACTO_PROD = network["fracto-prod"];
const AXIOS_CONFIG = {
   responseType: 'blob',
   headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Access-Control-*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
   },
   mode: 'no-cors',
   crossdomain: true,
}

export const get_manifest = async (on_update, on_complete) => {
   const url = `${FRACTO_PROD}/manifest/tiles/${TILE_SET_INDEXED}/packet_manifest.json`
   try {
      const response = await axios.get(url, AXIOS_CONFIG);
      const blob = new Blob([response.data], {type: 'application/gzip'});
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ascii = Buffer.from(buffer, 'ascii');
      const tile_manifest = JSON.parse(ascii.toString());
      const packet_count = tile_manifest.packet_files.length
      const tile_count = tile_manifest.tile_count
      let packet_index = 0
      for (const manifest_file of tile_manifest.packet_files) {
         await load_packet(manifest_file)
         if (on_update) {
            on_update({manifest_file, packet_index, packet_count, tile_count});
         }
         packet_index++
      }
      const complete_message = `${TILE_SET_INDEXED} tile set load complete`
      on_complete(complete_message)
   } catch (e) {
      console.log('error in get_manifest()', e);
   }
}

const load_packet = async (manifest_file) => {
   const url = `${FRACTO_PROD}/manifest/tiles/${TILE_SET_INDEXED}/${manifest_file}`
   try {
      const response = await axios.get(url, AXIOS_CONFIG);
      const blob = new Blob([response.data], {type: 'application/gzip'});
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ascii = Buffer.from(buffer, 'ascii');
      const packet_data = JSON.parse(ascii.toString());
      FractoIndexedTiles.integrate_tile_packet(TILE_SET_INDEXED, packet_data)
   } catch (e) {
      console.log('error in get_manifest()', e);
   }
}

export const get_tiles = (
   width_px,
   focal_point,
   scope,
   aspect_ratio) => {

   const all_tiles = []
   const height_px = width_px * aspect_ratio
   const tiles_on_edge_x = Math.ceil(width_px / 256) + 1;
   const tiles_on_edge_y = Math.ceil(height_px / 256) + 1;
   const max_tiles = Math.ceil(tiles_on_edge_x * tiles_on_edge_y + 1)
   // console.log('get_tiles max_tiles', max_tiles)
   const min_level = 3
   const max_level = 30
   for (let level = min_level; level < max_level; level++) {
      const level_tiles = tiles_in_scope(
         level, focal_point, scope, aspect_ratio);
      all_tiles.push({
         level: level,
         level_tiles: level_tiles
      })
      if (level_tiles.length > max_tiles) {
         break;
      }
   }
   return all_tiles.filter(tiles => tiles.level_tiles.length)
      .sort((a, b) => a.level > b.level ? 1 : -1)
}

const tiles_in_scope = (level, focal_point, scope, aspect_ratio = 1.0, set_name = TILE_SET_INDEXED) => {
   const width_by_two = scope / 2;
   const height_by_two = width_by_two * aspect_ratio;
   const viewport = {
      left: focal_point.x - width_by_two,
      top: focal_point.y + height_by_two,
      right: focal_point.x + width_by_two,
      bottom: focal_point.y - height_by_two,
   }
   const set_level = FractoIndexedTiles.get_set_level(set_name, level)
   if (!set_level) {
      console.log(`no bin for level ${level} of set_name ${set_name}`)
      return []
   }
   if (!set_level.columns.length) {
      // console.log(`no columns for level ${level} of set_name ${set_name}`)
      return []
   }
   // console.log(`tiles_in_scope columns for level ${level}: ${set_level.columns.length}`)
   const columns = set_level.columns
      .filter(column => {
         if (column.left > viewport.right) {
            return false
         }
         if (column.left + set_level.tile_size < viewport.left) {
            return false
         }
         return true;
      })
   let short_codes = []
   const max_y = viewport.top > Math.abs(viewport.bottom)
      ? viewport.top : Math.abs(viewport.bottom)
   for (let column_index = 0; column_index < columns.length; column_index++) {
      const tiles_in_column = columns[column_index].tiles
      const column_left = columns[column_index].left
      const column_tiles = tiles_in_column
         .filter(tile => {
            if (tile.bottom > max_y) {
               return false
            }
            if (tile.bottom + set_level.tile_size < viewport.bottom) {
               return false
            }
            return true
         })
         .map(tile => {
            return {
               bounds: {
                  left: column_left,
                  right: column_left + set_level.tile_size,
                  bottom: tile.bottom,
                  top: tile.bottom + set_level.tile_size
               },
               short_code: tile.short_code
            }
         })
      short_codes = short_codes.concat(column_tiles)
   }
   return short_codes
}

export const init_canvas_buffer = (width_px, aspect_ratio) => {
   let height_px = Math.round(width_px * aspect_ratio);
   if (height_px & 1) {
      height_px -= 1
   }
   return new Array(width_px)
      .fill(0)
      .map((x_value, x_index) => {
         return new Array(height_px)
            .fill(0)
            .map((y_value, y_index) => {
               return [0, 4]
            })
      })
}

export const fill_canvas_buffer = async (
   canvas_buffer,
   width_px,
   focal_point,
   scope,
   aspect_ratio) => {
   const all_level_sets = []
   get_tiles(width_px, focal_point, scope, aspect_ratio)
      .forEach(level_set => {
         all_level_sets.push(level_set)
      })
   console.log('all_level_sets.length', all_level_sets.length)
   const level_data_sets = all_level_sets
      .map(level_set => {
         const tile_width =
            level_set.level_tiles[0].bounds.right
            - level_set.level_tiles[0].bounds.left
         level_set.tile_increment = tile_width / 256
         return level_set
      })
      .sort((a, b) => a.level > b.level ? -1 : 1)
   console.log('level_data_sets.length', level_data_sets.length)
   level_data_sets.forEach(level_set => {
      level_set.level_tiles.forEach(async tile => {
         if (BAD_TILES[tile.short_code]) {
            return;
         }
         await FractoTileCache.get_tile(tile.short_code)
      })
   })
   console.log('calling raster_fill')
   await raster_fill(
      canvas_buffer,
      level_data_sets,
      width_px,
      focal_point,
      scope,
      aspect_ratio
   )
}

const raster_fill = async (
   canvas_buffer,
   level_data_sets,
   width_px,
   focal_point,
   scope,
   aspect_ratio) => {
   if (!canvas_buffer) {
      return;
   }
   const canvas_increment = scope / width_px
   const height_px = width_px * aspect_ratio
   const horz_scale = []
   for (let horz_x = 0; horz_x < width_px; horz_x++) {
      horz_scale[horz_x] = focal_point.x + (horz_x - width_px / 2) * canvas_increment
   }
   const vert_scale = []
   for (let vert_y = 0; vert_y < height_px; vert_y++) {
      vert_scale[vert_y] = Math.abs(focal_point.y - (vert_y - height_px / 2) * canvas_increment)
   }
   let unfound = 0
   for (let canvas_x = 0; canvas_x < width_px; canvas_x++) {
      const x = horz_scale[canvas_x]
      for (let canvas_y = 0; canvas_y < height_px; canvas_y++) {
         const y = vert_scale[canvas_y]
         let found_point = false
         for (let index = 0; index < level_data_sets.length; index++) {
            const level_data_set = level_data_sets[index]
            const tile = level_data_set.level_tiles
               .find(tile => tile.bounds.left <= x
                  && tile.bounds.right >= x
                  && tile.bounds.top >= y
                  && tile.bounds.bottom <= y)
            if (tile) {
               if (BAD_TILES[tile.short_code]) {
                  continue;
               }
               let tile_data = null
               try {
                  tile_data = await FractoTileCache.get_tile(tile.short_code)
                  const tile_x = Math.floor(
                     (x - tile.bounds.left) / level_data_set.tile_increment)
                  const tile_y = Math.floor(
                     (tile.bounds.top - y) / level_data_set.tile_increment)
                  const pattern = tile_data[tile_x][tile_y][0]
                  const iteration = tile_data[tile_x][tile_y][1]
                  canvas_buffer[canvas_x][canvas_y] = [pattern, iteration]
                  found_point = true
               } catch (e) {
                  if (!tile_data) {
                     BAD_TILES[tile.short_code] = true
                  }
                  // console.log('canvas_buffer size error', canvas_x, canvas_y, e)
                  continue;
               }
               break;
            }
         }
         if (!found_point) {
            unfound++
         }
         const out_of_bounds = (x <= -2) || (x > 0.5) || (y >= 1) || (y <= 1)
         if (!found_point && out_of_bounds) {
            const {pattern, iteration} = FractoFastCalc.calc(x, y)
            canvas_buffer[canvas_x][canvas_y] = [pattern, iteration]
         }
      }
   }
   console.log('unfound', unfound)
}
