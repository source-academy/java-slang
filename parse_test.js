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
try {
  jp.parse(src);
  console.log('Parsed OK');
} catch (e) {
  console.error('ERROR:', e.message);
  if (e.location) console.error('Location:', JSON.stringify(e.location));
  console.error(e.stack);
}
