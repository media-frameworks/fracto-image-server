const MAX_PATTERN = 20000

const GREY_BASE = 25
const GREY_RANGE = (255 - GREY_BASE)

const COLOR_LUM_BASE_PCT = 15
const COLOR_LUM_BASE_RANGE_PCT = 40

export class FractoColors {

   static pattern_hues = null

   static init_pattern_hues = () => {
      FractoColors.pattern_hues = new Array(MAX_PATTERN).fill(0)
      for (let pattern = 1; pattern < MAX_PATTERN; pattern++) {
         const log2 = Math.log2(pattern);
         FractoColors.pattern_hues[pattern] = Math.floor(360 * (log2 - Math.floor(log2)))
      }
   }

   static pattern_hue = (pattern) => {
      if (!FractoColors.pattern_hues) {
         FractoColors.init_pattern_hues()
      }
      let pattern_in_range = pattern
      while (pattern_in_range > MAX_PATTERN) {
         pattern_in_range /= 2
      }
      return FractoColors.pattern_hues[pattern_in_range]
   }

   static fracto_pattern_color_hsl = (pattern, iterations = 255) => {
      if (pattern === -1) {
         return [0, 0, 0]
      }
      const cache_key = `(${pattern},${iterations})`;
      if (COLOR_CACHE[cache_key]) {
         return COLOR_CACHE[cache_key];
      }
      if (pattern === 0) {
         let offset = Math.log(iterations) * ONE_BY_LOG_TEN_THOUSAND;
         // if (iterations < 21) {
         //    offset *= 0.9;
         // }
         const lum = 1.0 - offset;
         const lum_pct = Math.round(100 * lum)
         COLOR_CACHE[cache_key] = [0, 0, lum_pct];
         CACHE_SIZE++;
         return COLOR_CACHE[cache_key];
      }

      const log2 = Math.log2(pattern);
      const hue = pattern ? 360 * (log2 - Math.floor(log2)) : 0;
      const lum = 0.15 + 0.75 * Math.log(iterations) * ONE_BY_LOG_ONE_MILLION;

      const lum_pct = Math.round(100 * lum)
      COLOR_CACHE[cache_key] = [Math.round(hue), 75, lum_pct];
      CACHE_SIZE++;
      return COLOR_CACHE[cache_key];
   }

   static fracto_pattern_color = (pattern, iterations = 255) => {
      const [hue, sat_pct, lum_pct] = fracto_pattern_color_hsl(pattern, iterations);
      return `hsl(${hue}, ${sat_pct}%, ${lum_pct}%)`
   }

   static pattern_color_hsl = (pattern, iteration) => {
      return FractoColors.fracto_pattern_color_hsl(pattern, iteration)
   }

   static get_greys_map = (all_pixels, all_sets_object, base_value, range_value) => {
      const total_pixels = all_pixels.length
      const all_sets = Object.keys(all_sets_object)
         .map(key => {
            const iteration = parseInt(key.slice(1))
            return {iteration, iteration_count: all_sets_object[key]}
         })
         .sort((a, b) => {
            return a.iteration - b.iteration
         })
      let best_bin_size = total_pixels / range_value
      let current_grey_tone = base_value + range_value
      let current_bin_size = 0
      let total_pixel_count = 0
      // console.log('all_sets', all_sets)
      all_sets.forEach((set, index) => {
         if (set.iteration_count > best_bin_size) {
            let reduce_by = Math.floor(set.iteration_count / best_bin_size)
            const threshhold = (current_grey_tone - base_value) / 10
            if (reduce_by > threshhold) {
               reduce_by = Math.round(threshhold) + 1
            }
            current_grey_tone -= reduce_by
            current_bin_size = 0
         } else if (set.iteration_count + current_bin_size < best_bin_size) {
            current_bin_size += set.iteration_count
         } else {
            current_bin_size = set.iteration_count
            current_grey_tone -= 1
         }
         total_pixel_count += set.iteration_count
         set.grey_tone = current_grey_tone
         const remaining_bins = current_grey_tone - base_value + 1
         best_bin_size = (total_pixels - total_pixel_count) / remaining_bins
      })
      let greys_map = {}
      all_sets.forEach(set => {
         const key = `_${set.iteration}`
         greys_map[key] = set.grey_tone
      })
      return greys_map
   }

   static buffer_to_canvas = (canvas_buffer, ctx, scale_factor = 1) => {
      const all_not_pattern_pixels = []
      const all_pattern_pixels = []
      const all_not_pattern_sets = {}
      const all_pattern_sets = {}
      for (let canvas_x = 0; canvas_x < canvas_buffer.length; canvas_x++) {
         for (let canvas_y = 0; canvas_y < canvas_buffer[canvas_x].length; canvas_y++) {
            const point_data = canvas_buffer[canvas_x][canvas_y]
            const key = `_${point_data[1]}`
            if (point_data[0] === 0) {
               if (!all_not_pattern_sets[key]) {
                  all_not_pattern_sets[key] = 0
               }
               all_not_pattern_sets[key] += 1
               all_not_pattern_pixels.push({iteration: point_data[1], canvas_x, canvas_y})
            } else {
               if (!all_pattern_sets[key]) {
                  all_pattern_sets[key] = 0
               }
               all_pattern_sets[key] += 1
               all_pattern_pixels.push({pattern: point_data[0], iteration: point_data[1], canvas_x, canvas_y})
            }
         }
      }

      const not_pattern_greys_map = FractoColors.get_greys_map(
         all_not_pattern_pixels, all_not_pattern_sets, GREY_BASE, GREY_RANGE)
      const pattern_greys_map = FractoColors.get_greys_map(
         all_pattern_pixels, all_pattern_sets, COLOR_LUM_BASE_PCT, COLOR_LUM_BASE_RANGE_PCT)

      const pixel_size = 1.5 * scale_factor
      all_not_pattern_pixels
         .forEach((pixel) => {
            const key = `_${pixel.iteration}`
            const grey_value = not_pattern_greys_map[key]
            ctx.fillStyle = `rgb(${grey_value},${grey_value},${grey_value})`
            ctx.fillRect(scale_factor * pixel.canvas_x, scale_factor * pixel.canvas_y,
               pixel_size, pixel_size);
         })

      all_pattern_pixels
         .forEach((pixel, pixel_index) => {
            const key = `_${pixel.iteration}`
            const lum_factor = pattern_greys_map[key]
            const hue = FractoColors.pattern_hue(pixel.pattern)
            ctx.fillStyle = `hsl(${hue}, 80%, ${100 - lum_factor}%)`
            ctx.fillRect(scale_factor * pixel.canvas_x, scale_factor * pixel.canvas_y,
               pixel_size, pixel_size);
         })
   }

}

export default FractoColors
