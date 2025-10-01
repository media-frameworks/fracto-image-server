// From: https://danceswithcode.net/engineeringnotes/linear_equations/linear_equations.html

export class LinearEquation {

   static get_standard_matrix = (point_count) => {
      let first_row = [1];
      let second_row = [1];
      for (let i = 0; i < point_count - 1; i++) {
         first_row.unshift(0);
         second_row.push(1);
      }
      let poly_matrix = [first_row, second_row];
      for (let factor = 2; factor < point_count; factor++) {
         let value = 1;
         let row_values = [1];
         for (let col = 0; col < point_count - 1; col++) {
            value *= factor;
            row_values.unshift(value);
         }
         poly_matrix.push(row_values);
      }
      console.log("poly_matrix", poly_matrix)
      return poly_matrix;
   }

   static solve_standard_polynolial = (constants) => {
      const poly_matrix = LinearEquation.get_standard_matrix(constants.length);
      return LinearEquation.solve(poly_matrix, constants);
   }

   static solve = (matrix, constants) => {
      const det = LinearEquation.determinant(matrix)
      if (!det) {
         return [];
      }
      const one_by_det = 1.0 / det;
      const degree = matrix.length;
      let result = [];
      for (let term = 0; term < degree; term++) {
         const values_matrix = matrix.map((row, row_index) => {
            const value_row = row.map((value, col_index) => {
               return col_index === term ? constants[row_index] : value
            });
            return value_row;
         });
         result.push(LinearEquation.determinant(values_matrix) * one_by_det)
      }
      return result;
   }

   static determinant = (matrix) => {
      const degree = matrix.length;
      if (degree === 2) {
         return (
            matrix[0][0] * matrix[1][1] -
            matrix[0][1] * matrix[1][0]
         );
      }
      let sign = 1;
      let sum = 0;
      const other_rows = matrix.filter((row, index) => index !== 0);
      for (let term = 0; term < degree; term++) {
         const sub_matrix = other_rows.map((row, index) => {
            return row.filter((r, i) => i !== term)
         });
         if (matrix[0][term]) {
             sum += sign * matrix[0][term] * LinearEquation.determinant(sub_matrix);
         }
         sign *= -1;
      }
      return sum;
   }

   static render_value = (poly_values, t) => {
      const point_count = poly_values.length;
      let t_powers = [1, t];
      let t_power_value = t;
      for (let i = 2; i < point_count; i++) {
         t_power_value *= t;
         t_powers.push(t_power_value);
      }
      let value = 0;
      for (let i = 0; i < point_count; i++) {
         value += poly_values[i] * t_powers[point_count - i - 1];
      }
      return value;
   }

}

export default LinearEquation;
