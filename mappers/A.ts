import { A as ABase } from 'cofe-ct-ecommerce/mappers/A';
export class A extends ABase {
  static m3() {
    console.log('m3 in B');
  }

  static m4() {
    console.log('m4 in B');
  }
}
