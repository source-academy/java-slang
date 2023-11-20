import Thread, { ThreadStatus } from './thread';

export abstract class AbstractThreadPool {
  protected threads: Thread[] = [];
  protected currentThread: Thread | null = null;
  protected onEmpty: () => void;

  constructor(onEmpty: () => void) {
    this.onEmpty = onEmpty;
  }

  /**
   * Adds a new thread to the threadpool.
   * Schedules the thread if the status is runnable.
   */
  abstract addThread(thread: Thread): void;

  /**
   * Updates the status of a thread.
   * Thread will be scheduled/unscheduled based on the new status.
   * If thread status becomes terminated and no more threads are in the threadpool,
   * the onEmpty callback will be called.
   */
  abstract updateStatus(thread: Thread, oldStatus: ThreadStatus): void;

  abstract quantumOver(thread: Thread): void;

  abstract run(): void;

  /**
   * Gets all threads in the threadpool.
   */
  getThreads(): Thread[] {
    return this.threads;
  }

  /**
   * Gets the current scheduled thread.
   */
  getCurrentThread(): Thread | null {
    return this.currentThread;
  }

  hasThreads(): boolean {
    this.clearTerminated();
    return (
      this.threads.length > 0
    );
  }

  clearTerminated() {
    this.threads = this.threads.filter(
      x => x.getStatus() !== ThreadStatus.TERMINATED
    );
  }
}
