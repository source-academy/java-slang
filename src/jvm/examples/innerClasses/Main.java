public class Main {
    private static class InnerClass {
        private static String value = "INNER";
        private void print() {
            System.out.println("InnerClass.print()");
        }
    
        private static void staticPrint() {
            System.out.println("InnerClass.staticPrint()");
        }
    
        public void run() {
            Main.staticOuter();
            Main m = new Main();
            m.outer();
            m.outerWithParam("Param1 from inner", "Param2 from inner");
            System.out.println(Main.value);
            System.out.println("InnerClass.run() finished");
        }
    
    }

    private static String value = "OUTER";

    private static void staticOuter() {
        System.out.println("Main.staticOuter()");
    }

    private void outer() {
        System.out.println("Main.outer()");
    }

    private void outerWithParam(String s, String s2) {
        System.out.println("Main.outerWithParam()");
        System.out.println(s);
        System.out.println(s2);
    }

    public static void main(String[] args) {
        InnerClass.staticPrint();
        InnerClass ic = new InnerClass();
        ic.print();
        System.out.println(InnerClass.value);
        ic.run();
        System.out.println("Main.main() finished");
    }
}