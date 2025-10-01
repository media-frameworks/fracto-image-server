import {i} from "mathjs";

const MAX_COEFFICIENTS = 5000

export class Monomial {

   coefficients = []

   constructor(coefficients = []) {
      for (let i = 0; i < MAX_COEFFICIENTS; i++) {
         this.coefficients.push(i < coefficients.length ? BigInt(`${coefficients[i]}`) : 0n)
      }
   }

   to_string = () => {
      const parts = []
      for (let i = 0; i < MAX_COEFFICIENTS; i++) {
         if (!this.coefficients[i]) {
            parts.push(0)
            continue
         }
         let exponent = ''
         if (i === 1) {
            exponent = 'z'
         } else if (i > 1) {
            exponent = `z^${i}`
         }
         if (this.coefficients[i] === 1n) {
            parts.push(exponent)
         } else if (this.coefficients[i] > 1n) {
            parts.push(`${this.coefficients[i]}${exponent}`)
         }
      }
      return parts.filter(part => part).reverse().join("+") || '0'
   }

   add = (m) => {
      for (let i = 0; i < 11; i++) {
         this.coefficients[i] += m.coefficients[i]
      }
      return this;
   }

   mul = (m) => {
      const result = new Monomial([])
      for (let i1 = 0; i1 < m.coefficients.length; i1++) {
         const c1 = m.coefficients[i1]
         for (let i2 = 0; i2 < this.coefficients.length; i2++) {
            const c2 = this.coefficients[i2]
            if (i1 + i2 < MAX_COEFFICIENTS) {
               result.coefficients[i1 + i2] += BigInt(`${c1}`) * BigInt(`${c2}`)
            }
         }
      }
      return result;
   }

   prime = () => {
      const result = new Monomial()
      for (let i = 1; i < this.coefficients.length; i++) {
         result.coefficients[i - 1] = BigInt(`${i}`) * BigInt(`${this.coefficients[i]}`)
      }
      return result
   }

}

export default Monomial;
