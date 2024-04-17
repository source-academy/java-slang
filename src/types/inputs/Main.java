public class Main {
  public static void main(String[] args) {
    String[] test = new String[]{"A", "B", "C"};
    System.out.println(test["Hi"]);
  }
}

public record Main(int id, String firstName, String lastName){}
