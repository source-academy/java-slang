class Task1 implements Runnable {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println("Task 1 - Count: " + i);
            try {
                Thread.sleep(40); // Simulate some work
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}

class Task2 implements Runnable {
    @Override
    public synchronized void run() {
        for (int i = 0; i < 6; i++) {
            System.out.println("Task 2 - Count: " + i);

            if (i == 5) {
                System.out.println("Task 2: throwing exception");
                int a = 1 / 0;
            }

            try {
                Thread.sleep(60); // Simulate some work
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}

class Task3 implements Runnable {
    public void crash() {
        System.out.println("Task 3: throwing exception");
        int a = 1 / 0;
    }

    @Override
    public synchronized void run() {
        for (int i = 0; i < 6; i++) {
            System.out.println("Task 3 - Count: " + i);

            if (i == 5) {
                System.out.println("Task 3: calling problem method");
                crash();
            }

            try {
                Thread.sleep(60); // Simulate some work
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}

public class Main {
    public static void main(String[] args) {
        // Create instances of the tasks
        Task1 task1 = new Task1();
        Task2 task2 = new Task2();
        Task3 task3 = new Task3();
        
        // Create threads and associate with tasks
        System.out.println("Test: Non synchronized run");
        Thread thread1 = new Thread(task1);
        Thread thread2 = new Thread(task1);
        
        // Start the threads
        thread1.start();
        thread2.start();
        
        try {
            // Wait for the threads to finish before exiting
            thread1.join();
            thread2.join();
            System.out.println("Test: Thread join after threads run");
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        System.out.println("Test: Non synchronized run");
        Thread thread3 = new Thread(task2);
        Thread thread4 = new Thread(task2);
        
        // Start the threads
        thread3.start();
        thread4.start();
        
        System.out.println("Test: No thread join after start");

        System.out.println("Test: Nested exception thrown");
        try {
            // Wait for the threads to finish before exiting
            thread3.join();
            thread4.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        Thread thread5 = new Thread(task3);
        Thread thread6 = new Thread(task3);
        thread5.start();
        thread6.start();

        
        System.out.println("Main thread exiting.");
    }
}
