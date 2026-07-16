const jp = require('java-parser');
const src = `class Main {
    public static void foo() throws Exception {
        throw new Exception();
    }
    
    public static void main(String args[]) {
      try {
        foo();
      } catch (Exception e) {
      }
    }
}`;
console.log('Source length:', src.length);
try {
  const cst = jp.parse(src);
  console.log('Parsed OK');
  // Print a small snippet of cst root type to confirm
  console.log('Root type:', cst.name || Object.keys(cst)[0]);
} catch (e) {
  console.error('ERROR:', e.message);
  if (e.location) console.error('Location:', JSON.stringify(e.location));
}
