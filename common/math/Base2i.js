import Complex from "./Complex";

const MAX_LEFT_DIGITS = 20;
const MAX_RIGHT_DIGITS = 60;
const SIZE_STAGING = 2 * MAX_LEFT_DIGITS + 2 * MAX_RIGHT_DIGITS;

export class Base2i {

   left_part: [];
   right_part: [];

   constructor(p0, p1) {
      this.staging = new Array(SIZE_STAGING).fill(0);
      if (Array.isArray(p0)) {
         this.left_part = p0;
         this.right_part = p1;
         // console.log("new ComplexQuarternary from arrays", this.left_part, this.right_part)
      } else {
         const [left_part, right_part] = Base2i.from_complex(p0, p1)

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

   to_complex = () => {
      const str_entry = this.to_string()
      const dot_position = str_entry.indexOf('.')
      const two_i = new Complex(0, 2)
      let current_result = new Complex(0, 0)
      let digit_power = dot_position - 1
      for (let i = 0; i < str_entry.length; i++) {
         const char = str_entry[i]
         if (char === '.') {
            continue
         }
         const current_digit_value = two_i.pow(digit_power--)
         // console.log('current_digit_value', current_digit_value.toString())
         let digit_value = new Complex(0, 0)
         switch (char) {
            case '0':
               break;
            case '1':
               digit_value = current_digit_value;
               break;
            case '2':
               digit_value = current_digit_value.scale(2);
               break;
            case '3':
               digit_value = current_digit_value.scale(3);
               break;
            default:
               console.log('error, Unknown char: ', char);
               break;
         }
         current_result = current_result.add(digit_value);
      }
      return current_result
   }

   static render_cq_recursive = (target, current, factor, result_pos, result, cb) => {
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
            if (Base2i.render_cq_recursive(target, new_current, new_factor, result_pos + 2, result, cb)) {
               result[result_pos] = digit;
               return true;
            }
            new_current += factor;
         }
         return false;
      }
   }

   // returns base-2i representation of a complex number, as [left of radix, right of radix]
   static from_complex = (re, im) => {
      let result_q = new Array(3 + MAX_RIGHT_DIGITS).fill(0)
      Base2i.render_cq_recursive(re, 0.0, -4.0, 0, result_q, returns => {
         // console.log("render_cq_recursive re returns", returns)
      })
      Base2i.render_cq_recursive(im, 0.0, 2.0, 1, result_q, returns => {
         // console.log("render_cq_recursive im returns", returns)
      })
      return [result_q.slice(0, 2), result_q.slice(3)];
   }

   static parse_float_base_4 = (base4String) => {
      const parts = base4String.split('.');
      let integerPart = 0;
      let fractionalPart = 0;

      // Parse integer part
      if (parts[0]) {
         integerPart = parseInt(parts[0], 4);
      }

      // Parse fractional part
      if (parts[1]) {
         for (let i = 0; i < parts[1].length; i++) {
            const digit = parseInt(parts[1][i], 4);
            fractionalPart += digit * Math.pow(4, -(i + 1));
         }
      }

      return integerPart + fractionalPart;
   }

   static generate_range = (left_part_count, right_part_count) => {
      const total_entries = Math.pow(4, left_part_count + right_part_count)
      console.log('total_entries', total_entries);
      const filtered_entries = []
      for (let index = 0; index < total_entries; index++) {
         const base_four_str = index.toString(4)
         const padded_base_four_str = base_four_str.padStart(left_part_count + right_part_count, '0')
         const left_str = padded_base_four_str.slice(0, left_part_count)
         const left_part = left_str.split('')
         const right_str = padded_base_four_str.slice(left_part_count)
         const right_part = right_str.split('')
         const base_2i_value = new Base2i(left_part, right_part)
         const complex_value = base_2i_value.to_complex()
         const magnitude = complex_value.magnitude()
         if (magnitude <= 2.0) {
            filtered_entries.push({
               base_2i_value: base_2i_value.to_string(),
               complex_value: {
                  re: complex_value.re,
                  im: complex_value.im,
               }})
         }
         // if (index % 100000 === 0) {
         //    console.log(`${filtered_entries.length} found in ${index}`)
         // }
      }
      console.log(`${filtered_entries.length} filtered entries`, filtered_entries)
      return filtered_entries
   }
}

export default Base2i
