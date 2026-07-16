const jp = require('java-parser');
const src = `class Parent {
    public int multiply(int x) throws Exception {
        return 0;
    }
}

public class Main extends Parent {

    public static void main(String[] args) throws Exception {
        Parent t = new Parent();
        int y = t.multiply(5);
    }
}`;
try {
  jp.parse(src);
  console.log('Parsed OK');
} catch (e) {
  console.error('ERROR:', e.message);
  if (e.location) console.error('Location:', JSON.stringify(e.location));
}
