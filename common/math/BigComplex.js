import {create, all} from 'mathjs'

const RESOLUTION_DIGITS = 32

const config = {};
const math = create(all, config)
math.config({
   number: 'BigNumber',      // Default type of number:
                             // 'number' (default), 'BigNumber', or 'Fraction'
   precision: RESOLUTION_DIGITS,            // Number of significant digits for BigNumbers
   // epsilon: 1e-500
})

const MAX_COMPARE_DIGITS = RESOLUTION_DIGITS;

export class BigComplex {

   re = 0;
   im = 0;

   constructor(re, im) {
      this.re = math.bignumber(re);
      this.im = math.bignumber(im);
   }

   get_re = (digits = 30) => {
      const re_str = `${this.re}`;
      return parseFloat(re_str.substring(0, digits))
   }

   get_im = (digits = 30) => {
      const im_str = `${this.im}`;
      return parseFloat(im_str.substring(0, digits))
   }

   is_valid = () => {
      if (isNaN(this.re.toNumber())) {
         return false;
      }
      if (isNaN(this.im.toNumber())) {
         return false;
      }
      return true;
   }

   toString = (limit = MAX_COMPARE_DIGITS) => {
      const re_str = `${this.re.toString()}`;
      const im_str = `${this.im.toString()}`;
      return `${re_str.substring(0, limit)}+${im_str.substring(0, limit)}i`;
   }

   compare = (z, limit = MAX_COMPARE_DIGITS) => {
      // const re_differs = math.compare(this.re, z.re);
      const re_differs = this.re.toString() !== z.re.toString();
      if (re_differs) {
         return false;
      }
      const im_differs = this.im.toString() !== z.im.toString();
      if (im_differs) {
         return false;
      }
      return true;
   }

   magnitude = () => {
      if (isNaN(this.re) || isNaN(this.im)) {
         return -1;
      }
      const re_squared = this.re.mul(this.re);
      const im_squared = this.im.mul(this.im);
      const sum_squares = math.chain(re_squared).add(im_squared).valueOf();
      return math.sqrt(sum_squares)
   }

   mul = (z) => {
      const re_left_part = this.re.mul(z.re);
      const re_right_part = this.im.mul(z.im);
      const re_part = math.subtract(re_left_part, re_right_part);
      const im_left_part = this.re.mul(z.im);
      const im_right_part = this.im.mul(z.re);
      const im_part = math.add(im_left_part, im_right_part);
      return new BigComplex(re_part, im_part)
   }

   divide = (den) => {
      const com_conj = new BigComplex(den.im, den.re);
      return this.mul(com_conj);
   }

   exp = () => {
      let big_result = new BigComplex(1, 0);
      let num = new BigComplex(1, 0);
      let factorial = math.bignumber(1);
      const epsilon = math.bignumber("1e-500");
      for (let i = 1; i < 500; i++) {
         num = num.mul(this);
         factorial = math.multiply(factorial, i);
         const recip_fact = math.divide(1, factorial);
         if (math.smaller(recip_fact, epsilon)) {
            console.log("precision reached at", i);
            break;
         }
         const term = num.scale(recip_fact);
         big_result = big_result.offset(term.re, term.im);
      }
      return big_result
   }

   log = () => {
      const z = math.complex(this.re, this.im);
      const result = math.log(z);
      return new BigComplex(result.re, result.im)
   }

   scale = (s) => {
      return new BigComplex(
         this.re.mul(math.bignumber(s)),
         this.im.mul(math.bignumber(s))
      );
   }

   offset = (re, im) => {
      return new BigComplex(
         this.re.add(math.bignumber(re)),
         this.im.add(math.bignumber(im))
      );
   }

   add = (c) => {
      return new BigComplex(this.re.add(c.re), this.im.add(c.im));
   }

   sqrt = () => {
      const re_squared = this.re.mul(this.re);
      // console.log("re_squared",re_squared.toString())

      const im_squared = this.im.mul(this.im);
      // console.log("im_squared",im_squared.toString())

      const sum_squares = math.chain(re_squared).add(im_squared).valueOf();
      // console.log("sum_squares",sum_squares.toString())

      const magnitude = math.sqrt(sum_squares)
      // console.log("magnitude",magnitude.toString())

      const re = math.chain(magnitude).add(this.re).multiply(0.5).sqrt().valueOf();
      // console.log("re",re.toString())

      const im = math.chain(magnitude).subtract(this.re).multiply(0.5).sqrt().multiply(math.sign(this.im)).valueOf();
      // console.log("im",im.toString())

      return new BigComplex(re, im);
   }

   cube_root = () => {
      const one = math.bignumber(1);
      const three = math.bignumber(3);
      const exponent = new BigComplex(one.div(three), 0)
      return this.pow(exponent)
   }

   nth_root = (n) => {
      const r = this.magnitude()
      const nth_root_r = this.pow(r, 1 / n);
      const theta = math.atan2(this.im, this.re)
      return new BigComplex(
         nth_root_r * math.cos(theta / n),
         nth_root_r * math.sin(theta / n)
      )
   }

   pow = (exponent) => {
      // Convert base to polar form (r * e^(i*theta))
      const r = this.magnitude();
      const theta = math.atan2(this.im, this.re);
      // console.log('pow, exponent', exponent.toString())

      // Apply Euler's formula for z^w = e^(w * ln(z))
      // where ln(z) = ln(r) + i*theta
      const ln_r = math.log(r);
      const exponent_re_times_ln_r = exponent.re.mul(ln_r)
      const exponent_im_times_ln_r = exponent.im.mul(ln_r)
      const exponent_re_times_theta = exponent.re.mul(theta)
      const exponent_im_times_theta = exponent.im.mul(theta)

      const term_re = exponent_re_times_ln_r.add(-exponent_im_times_theta);
      const term_im = exponent_im_times_ln_r.add(exponent_re_times_theta)

      const magnitude = math.exp(term_re);
      const cos_im = math.cos(term_im)
      const sin_im = math.sin(term_im)
      const result_re = magnitude.mul(cos_im)
      const result_im = magnitude.mul(sin_im)

      return new BigComplex(result_re, result_im);
   }
}

export default BigComplex;
