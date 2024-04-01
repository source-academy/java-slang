public class Main {
  public static void main(String[] args) {
    printMessage(1); 
  }

  public static InvalidType printMessage(String message) { 
    int test = 1 * "String";
  }
}