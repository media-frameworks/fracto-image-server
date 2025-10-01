const MAX_LEFT_DIGITS = 20;
const MAX_RIGHT_DIGITS = 60;
const SIZE_STAGING = 2 * MAX_LEFT_DIGITS + 2 * MAX_RIGHT_DIGITS;

const TIMES_TABLE = [
   [0, 0, 0, 0],
   [0, 1, 2, 3],
   [0, 2, 4, 6],
   [0, 3, 6, 9]
]

export class ComplexQuarternary {

   left_part: [];
   right_part: [];
   staging: null;

   constructor(p0, p1) {
      this.staging = new Array(SIZE_STAGING).fill(0);
      if (Array.isArray(p0)) {
         this.left_part = p0;
         this.right_part = p1;
         // console.log("new ComplexQuarternary from arrays", this.left_part, this.right_part)
      } else {
         const [left_part, right_part] = this.from_complex(p0, p1)

         this.left_part = new Array(MAX_LEFT_DIGITS).fill(0);
         this.right_part = new Array(MAX_RIGHT_DIGITS).fill(0);

         for (let l_index = 0; l_index < left_part.length; l_index++) {
            this.left_part[MAX_LEFT_DIGITS - left_part.length + l_index] = left_part[l_index];
         }
         for (let r_index = 0; r_index < right_part.length; r_index++) {
            this.right_part[r_index] = right_part[r_index];
         }
      }
   }

   to_string = () => {
      let str_result = '';
      let digit = 0;
      while (this.left_part[digit] === 0 && this.left_part[digit + 1] === 0 && digit < this.left_part.length - 1) {
         digit++;
      }
      if (digit > 0) {
         digit--;
      }
      for (; digit < this.left_part.length; digit++) {
         str_result += String(this.left_part[digit]);
      }
      str_result += '.';
      for (let digit = 0; digit < this.right_part.length; digit++) {
         str_result += String(this.right_part[digit]);
      }
      return str_result;
   }

   carry_left = () => {
      // console.log("carry_left", this)
      for (let r_index = this.right_part.length - 1; r_index >= 0; r_index--) {
         const mod_value = this.right_part[r_index] % 4;
         const div_value = Math.floor(this.right_part[r_index] / 4);
         if (div_value) {
            if (r_index === 1) {
               this.left_part[MAX_LEFT_DIGITS - 1] -= div_value;
            } else if (r_index === 0) {
               this.left_part[MAX_LEFT_DIGITS - 2] -= div_value;
            } else {
               this.right_part[r_index - 2] -= div_value;
            }
         }
         this.right_part[r_index] = mod_value;
      }
      for (let l_index = this.left_part.length - 1; l_index >= 2; l_index--) {
         const mod_value = this.left_part[l_index] % 4;
         const div_value = Math.floor(this.left_part[l_index] / 4);
         if (div_value) {
            this.left_part[l_index - 2] -= div_value;
         }
         this.left_part[l_index] = mod_value;
      }
   }

   quick_mult = (a, b) => {
      // return a * b;
      if (!a || !b) {
         return 0;
      }
      if (a === 1) {
         return b;
      }
      if (b === 1) {
         return a;
      }
      return TIMES_TABLE[a][b];
   }

   square_sum = (p) => {
      this.staging.fill(0)

      // prepare right digits for multiplication
      let base_index_right = MAX_RIGHT_DIGITS - 1;
      for (let op1_index = 0; op1_index < MAX_RIGHT_DIGITS; op1_index++) {
         const factor = this.right_part[base_index_right - op1_index];
         if (!factor) {
            continue;
         }
         const base_staging = SIZE_STAGING - op1_index - 1;
         for (let op2_index = 0; op2_index < MAX_RIGHT_DIGITS; op2_index++) {
            this.staging[base_staging - op2_index] +=
               this.quick_mult(factor, this.right_part[base_index_right - op2_index]);
         }
      }
      // prepare left digits for multiplication
      let base_index_keft = MAX_LEFT_DIGITS - 1;
      for (let op1_index = 0; op1_index < MAX_LEFT_DIGITS; op1_index++) {
         const factor = this.left_part[base_index_keft - op1_index];
         if (!factor) {
            continue;
         }
         const base_staging = SIZE_STAGING - MAX_RIGHT_DIGITS - op1_index - 1;
         for (let op2_index = 0; op2_index < MAX_LEFT_DIGITS; op2_index++) {
            this.staging[base_staging - op2_index] +=
               this.quick_mult(factor, this.left_part[base_index_keft - op2_index]);
         }
      }

      // add p right
      for (let digit = 0; digit < MAX_RIGHT_DIGITS; digit++) {
         if (!p.right_part[digit]) {
            continue;
         }
         this.staging[2 * MAX_LEFT_DIGITS + digit] += p.right_part[digit]
      }
      // add p left
      for (let digit = 0; digit < MAX_LEFT_DIGITS; digit++) {
         if (!p.left_part[digit]) {
            continue;
         }
         this.staging[MAX_LEFT_DIGITS + digit] += p.left_part[digit]
      }

      // carry all digits
      for (let digit = 0; digit < SIZE_STAGING - 2; digit++) {
         const digit_index = SIZE_STAGING - digit - 1;
         const digit_value = this.staging[digit_index];
         const mod_value = digit_value % 4;
         const div_value = Math.floor(digit_value / 4);
         this.staging[digit_index - 2] -= div_value;
         this.staging[digit_index] = mod_value;
      }

      // crop back to normal size and return
      for (let digit = 0; digit < MAX_LEFT_DIGITS; digit++) {
         this.left_part[digit] = this.staging[MAX_LEFT_DIGITS + digit];
      }
      for (let digit = 0; digit < MAX_RIGHT_DIGITS; digit++) {
         this.right_part[digit] = this.staging[2 * MAX_LEFT_DIGITS + digit];
      }
      return this;
   }

   add = (q) => {
      for (let left_index = 0; left_index < MAX_LEFT_DIGITS; left_index++) {
         this.left_part[left_index] += q.left_part[left_index]
      }
      for (let right_index = 0; right_index < MAX_RIGHT_DIGITS; right_index++) {
         this.right_part[right_index] += q.right_part[right_index]
      }
      this.carry_left();
      return this;
   }

   render_cq_recursive = (target, current, factor, result_pos, result, cb) => {
      if (result_pos >= MAX_RIGHT_DIGITS) {
         return false;
      }
      const delta_1 = Math.abs(target - current);
      if (delta_1 < 0.000000000000001) {
         // console.log("exact match", target, current)
         cb("exact match");
         return true;
      } else if (delta_1 > 4 * Math.abs(factor)) {
         return false;
      } else {
         const new_factor = factor / -4.0;
         let new_current = current
         for (let digit = 0; digit <= 3; digit++) {
            if (this.render_cq_recursive(target, new_current, new_factor, result_pos + 2, result, cb)) {
               result[result_pos] = digit;
               return true;
            }
            new_current += factor;
         }
         return false;
      }
   }

   // returns base-2i representation of a complex number, as [left of radix, right of radix]
   from_complex = (re, im) => {
      let result_q = new Array(3 + MAX_RIGHT_DIGITS).fill(0)
      this.render_cq_recursive(re, 0.0, -4.0, 0, result_q, returns => {
         // console.log("render_cq_recursive re returns", returns)
      })
      this.render_cq_recursive(im, 0.0, 2.0, 1, result_q, returns => {
         // console.log("render_cq_recursive im returns", returns)
      })
      return [result_q.slice(0, 2), result_q.slice(3)];
   }

}

export default ComplexQuarternary
