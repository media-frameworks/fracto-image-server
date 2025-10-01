import {create, all} from 'mathjs'

const config = {};
const math = create(all, config)
math.config({
   number: 'BigNumber',      // Default type of number:
                             // 'number' (default), 'BigNumber', or 'Fraction'
   precision: 500,            // Number of significant digits for BigNumbers
   epsilon: 1e-495
})

export const BIG_PI_500_STR = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491";
export const BIG_PI_1000_STR = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989";

export class BigTrig {

   static pi = math.bignumber(BIG_PI_500_STR);
   static pi_by_four = math.divide(BigTrig.pi, 4);
   static pi_by_two = math.divide(BigTrig.pi, 2);
   static two_pi = math.multiply(BigTrig.pi, 2);
   static epsilon = math.bignumber("1e-495");

   static sin = (angle) => {

      let x = math.bignumber(angle);
      let sign = 1;
      if (math.isNegative(x)) {
         sign = -1;
         x = math.multiply(x, -1);
      }

      while (math.isNegative(x)) {
         x = math.add(x, BigTrig.two_pi);
      }
      while (math.larger(x, BigTrig.two_pi)) {
         x = math.subtract(x, BigTrig.two_pi);
      }

      if (math.larger(x, BigTrig.pi)) {
         x = math.subtract(x, BigTrig.pi);
         sign *= -1
      }
      if (math.larger(x, BigTrig.pi_by_two)) {
         x = math.subtract(BigTrig.pi, x);
      }

      let term = x;
      let xsqr = math.multiply(x, x);
      let sum = x;
      let i = 1;

      while (math.larger(term, BigTrig.epsilon)) {
         term = math.chain(term).multiply(xsqr).divide((i + 1) * (i + 2)).multiply(-1).valueOf();
         sum = math.add(sum, term);
         i += 2;
      }
      return (sign < 0 ? math.multiply(sum, -1) : sum);
   }

   static cos = (angle) => {
      const x = math.subtract(BigTrig.pi_by_two, angle)
      return BigTrig.sin(x)
   }

   static atan = (slope) => {

      let x = math.bignumber(slope);
      let sgn = 1;
      if (math.isNegative(x)) {
         sgn = -1;
         x = math.multiply(-1, x)
      }
      const big_zero = math.bignumber(0)
      const big_one = math.bignumber(1)
      const big_two = math.bignumber(2)

      let s;
      if (math.larger(x, big_one)) {
         const one_div_x = math.divide(big_one, x);
         const atan_one_div_x = BigTrig.atan(one_div_x);
         const atan_one = BigTrig.atan(big_one);
         s = math.chain(atan_one).multiply(big_two).subtract(atan_one_div_x).valueOf();
      } else {
         const x_squared = math.multiply(x, x);
         const x_squared_plus_1 = math.add(x_squared, big_one)
         const y = math.divide(x_squared, x_squared_plus_1)
         s = math.divide(x, x_squared_plus_1)
         let k = 1
         let lastt = big_zero;
         let t = s;
         let test = math.chain(lastt).subtract(t).abs().valueOf();
         while (!math.smaller(test, BigTrig.epsilon)) {
            lastt = t;
            t = math.chain(t).multiply(2 * k).divide(2 * k + 1).multiply(y).valueOf();
            s = math.add(s, t);
            test = math.chain(lastt).subtract(t).abs().valueOf();
            k++
         }
      }
      return (sgn < 0 ? math.multiply(s, -1) : s)
   }
}

export default BigTrig;
