const jp = require('java-parser');
const inner = `public static void foo() throws Exception {
  throw new Exception();
}
public static void main(String args[]) {
  try {
    foo();
  } catch (Exception e) {
  }
}`;
const wrapped = `public class Main { public static void main(String args[]) { ${inner} } }`;
console.log('---SOURCE---');
console.log(wrapped);
console.log('---PARSE OUTPUT---');
try {
  jp.parse(wrapped);
  console.log('Parsed OK');
} catch (e) {
  console.error('ERROR:', e.message);
  if (e.location) console.error('Location:', JSON.stringify(e.location));
}
