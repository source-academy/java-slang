
class Slow {
    static {
        System.out.println("Initializer start");
        try {
            Thread.sleep(2000);
            System.out.println("Initializer finish");
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public void doSomething() {
        System.out.println("doSomething");
    }
}

class Task1 implements Runnable {
    @Override
    public void run() {
        System.out.println("Task 1 start");
        Slow s = new Slow();
        s.doSomething();
        System.out.println("Task 1 end");
    }
}


public class Main {
    public static void main(String[] args) {
        // Create instances of the tasks
        Task1 task1 = new Task1();
        
        // Create threads and associate with tasks
        System.out.println("Test: Static initializer");
        Thread thread1 = new Thread(task1);
        Thread thread2 = new Thread(task1);
        
        // Start the threads
        thread1.start();
        thread2.start();
        System.out.println("Main thread exiting.");
    }
}
