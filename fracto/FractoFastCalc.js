const MAX_ORBITAL_SIZE = 25000
const MIN_ITERATION = 2000000 // 2 million

export class FractoFastCalc {

   static super_calc = (x0, y0) => {
      if (FractoFastCalc.point_in_main_cardioid(x0, y0)) {
         return FractoFastCalc.calc(x0, y0)
      }
      const P_x = x0
      const P_y = y0
      let Q_x_squared = 0
      let Q_y_squared = 0
      let Q_x = 0
      let Q_y = 0
      let iteration = 0
      let pattern = 0
      let current_minimum = 0.99 * Math.sqrt(x0 * x0 + y0 * y0)
      const max_iteration = 100000000 // one hundred million
      for (; iteration < max_iteration; iteration++) {
         Q_y = 2 * Q_x * Q_y + P_y;
         Q_x = Q_x_squared - Q_y_squared + P_x;
         Q_x_squared = Q_x * Q_x
         Q_y_squared = Q_y * Q_y
         const sum_squares = Q_x_squared + Q_y_squared
         if (sum_squares > 100) {
            console.log('escaped')
            return {pattern: 0, iteration};
         }
         if (iteration > 1 && sum_squares < current_minimum) {
            current_minimum = sum_squares
            pattern = iteration
         }
         if (pattern > 1 && 100 * pattern < iteration) {
            const true_iteration = FractoFastCalc.best_iteration(pattern, x0, y0)
            return {pattern, true_iteration};
         }
      }
   }

   static calc = (x0, y0, level = 10) => {
      const P_x = x0
      const P_y = y0
      let Q_x_squared = 0
      let Q_y_squared = 0
      let Q_x = 0
      let Q_y = 0
      let first_pos = {}
      let orbital = 0
      let least_magnitude = 1
      let best_orbital = 0
      let iteration = 1
      const iteration_factor = (MIN_ITERATION * level) + MAX_ORBITAL_SIZE
      const max_iteration = Math.round(iteration_factor / MAX_ORBITAL_SIZE) * MAX_ORBITAL_SIZE
      for (; iteration < max_iteration; iteration++) {
         Q_y = 2 * Q_x * Q_y + P_y;
         Q_x = Q_x_squared - Q_y_squared + P_x;
         Q_x_squared = Q_x * Q_x
         Q_y_squared = Q_y * Q_y
         if (Q_x_squared + Q_y_squared > 100) {
            return {
               pattern: 0,
               iteration: iteration,
            };
         }
         if (iteration % MAX_ORBITAL_SIZE === 0) {
            first_pos = {x: Q_x, y: Q_y}
            orbital = 0
         } else if (iteration > MAX_ORBITAL_SIZE) {
            orbital++
            if (Q_x === first_pos.x && Q_y === first_pos.y) {
               if (iteration < 60000) {
                  iteration = FractoFastCalc.best_iteration(orbital, x0, y0)
               }
               return {
                  pattern: orbital,
                  iteration: iteration,
                  // orbital_points: orbital_points
               };
            }
         }
      }
      return {
         pattern: best_orbital,
         iteration: iteration,
         Q_s: []
      };
   }

   static best_iteration = (pattern, x, y) => {
      const P_x = x
      const P_y = y
      let Q_x_squared = 0
      let Q_y_squared = 0
      let Q_x = 0
      let Q_y = 0
      let first_pos_x = x
      let first_pos_y = y
      for (let iteration = 0; iteration < 60000; iteration++) {
         Q_y = 2 * Q_x * Q_y + P_y;
         Q_x = Q_x_squared - Q_y_squared + P_x;
         Q_x_squared = Q_x * Q_x
         Q_y_squared = Q_y * Q_y
         if (iteration % pattern === 0 && iteration) {
            if (Q_x === first_pos_x && Q_y === first_pos_y) {
               return iteration
            }
            first_pos_x = Q_x
            first_pos_y = Q_y
         }
      }
      return -1
   }

}

export default FractoFastCalc
