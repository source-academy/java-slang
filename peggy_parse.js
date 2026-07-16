const fs = require('fs');
const peggy = require('peggy');
const grammar = fs.readFileSync('src/compiler/grammar.pegjs', 'utf8');
const parser = peggy.generate(grammar);
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
  parser.parse(src);
  console.log('PEG Parsed OK');
} catch (e) {
  console.error('PEG ERROR:', e.message);
  if (e.location) console.error('Location:', JSON.stringify(e.location));
}
