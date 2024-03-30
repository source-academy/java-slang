import java.lang.reflect.Method;
import java.util.function.Function;

public class InvokeDynamic {
    public static void main(String[] args) {
        Function<String, Void> i = (String a) -> {
            System.out.println(a);
            return null;
        };
        Function<String, Void> i2 = (String a) -> {
            System.out.println(a);
            return null;
        };
        
        i.apply("TEST");
        i2.apply("TEST");

        Class<?> c = Main.class;
        for (Method method : c.getDeclaredMethods()) {
            System.out.println(method.getName());
            System.out.println(method.getModifiers());
        }
    }
}
