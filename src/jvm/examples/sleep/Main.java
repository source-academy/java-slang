public class Main {
    public static void main(String[] args) {
        long start = System.currentTimeMillis();
        System.out.println("Sleeping for 5 seconds...");
        try {
            Thread.sleep(5000);
            long end = System.currentTimeMillis();
            System.out.println("Slept for " + (end - start) + " milliseconds");
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}