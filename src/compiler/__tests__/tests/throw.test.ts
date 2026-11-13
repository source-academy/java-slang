import * as peggy from 'peggy'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { BinaryWriter } from '../../binary-writer'
import { extractClassMetaFromBuffer } from '../../import/extract-metadata'
import { runTest, testCase } from '../__utils__/test-utils'
import { compile } from '../../index'
import { AST } from '../../../ast/types/packages-and-modules'
import { javaPegGrammar } from '../../grammar'
import { peggyFunctions } from '../../peggy-functions'

const testCases: testCase[] = [
  {
    comment: 'user-defined exceptions thrown, propagated, rethrown and caught',
    program: `
      class AppException extends Exception {
        public int code;
        public String getMessage() { return "app failure " + code; }
      }
      class InputException extends AppException { }
      class FatalException extends AppException { }
      class UncheckedProblem extends RuntimeException {
        public String detail = "unchecked";
        public String getMessage() { return detail; }
      }
      class Broken extends Error { }
      class Resource {
        int id;
        Resource(int id) throws AppException {
          if (id < 0) {
            InputException e = new InputException();
            e.code = id;
            throw e;
          }
          this.id = id;
        }
        void use(int times) throws AppException {
          if (times > 2) {
            AppException e = new AppException();
            e.code = times;
            throw e;
          }
        }
      }
      public class Main {
        static int log;

        static void fail(int code) throws AppException {
          AppException e = new AppException();
          e.code = code;
          throw e;
        }

        static void failInput(int code) throws InputException {
          InputException e = new InputException();
          e.code = code;
          throw e;
        }

        static int level3(int x) throws AppException {
          if (x == 1) { failInput(11); }
          if (x == 2) { fail(22); }
          if (x == 3) { throw new FatalException(); }
          return x * 10;
        }

        static int level2(int x) throws AppException {
          return level3(x) + 1;
        }

        static int level1(int x) {
          try {
            return level2(x);
          } catch (InputException e) {
            return -1;
          } catch (AppException e) {
            return -2;
          }
        }

        static int pick(int x) {
          if (x > 0) {
            return x;
          }
          throw new UncheckedProblem();
        }

        static int withFinally(int x) {
          try {
            if (x == 0) { throw new UncheckedProblem(); }
            return 100;
          } catch (UncheckedProblem e) {
            return 200;
          } finally {
            log = log + 1;
          }
        }

        static void rethrow(int x) throws AppException {
          try {
            fail(x);
          } catch (AppException e) {
            log = log + 10;
            throw e;
          }
        }

        static void replace() {
          try {
            throw new UncheckedProblem();
          } catch (UncheckedProblem e) {
            throw new Broken();
          }
        }

        static void nested(int x) throws AppException {
          try {
            try {
              if (x == 1) { throw new UncheckedProblem(); }
              if (x == 2) { fail(2); }
            } finally {
              log = log + 100;
            }
          } catch (UncheckedProblem e) {
            log = log + 1000;
          }
        }

        public static void main(String[] args) {
          System.out.println(level1(0));
          System.out.println(level1(1));
          System.out.println(level1(2));
          System.out.println(level1(3));
          System.out.println(level1(4));

          try {
            fail(7);
          } catch (AppException e) {
            System.out.println(e.getMessage());
            System.out.println(e.code);
            System.out.println(e);
          }

          try {
            throw new UncheckedProblem();
          } catch (RuntimeException e) {
            System.out.println("runtime " + e.getMessage());
          }

          try {
            pick(0);
          } catch (UncheckedProblem e) {
            System.out.println("pick failed");
          }
          System.out.println(pick(5));

          System.out.println(withFinally(0));
          System.out.println(withFinally(1));
          System.out.println(log);

          try {
            rethrow(3);
          } catch (AppException e) {
            System.out.println("rethrown " + e.code);
          }
          System.out.println(log);

          try {
            replace();
          } catch (Broken b) {
            System.out.println("replaced");
          }

          log = 0;
          try {
            nested(0);
            nested(1);
            nested(2);
          } catch (AppException e) {
            System.out.println("nested " + e.code);
          }
          System.out.println(log);

          try {
            Resource ok = new Resource(1);
            ok.use(1);
            ok.use(3);
            System.out.println("not reached");
          } catch (AppException e) {
            System.out.println("use " + e.code);
          }
          try {
            Resource bad = new Resource(-5);
            System.out.println("not reached");
          } catch (InputException e) {
            System.out.println("ctor " + e.code);
          } catch (AppException e) {
            System.out.println("wrong handler");
          }

          try {
            throw null;
          } catch (NullPointerException e) {
            System.out.println("npe");
          }

          int caught = 0;
          for (int i = 0; i < 5; i++) {
            try {
              if (i % 2 == 0) { throw new UncheckedProblem(); }
              caught = caught + 100;
            } catch (UncheckedProblem e) {
              caught = caught + 1;
            }
          }
          System.out.println(caught);

          try {
            Throwable t = new FatalException();
            throw t;
          } catch (Throwable t) {
            System.out.println("throwable");
          }

          try {
            Exception ex = new InputException();
            throw ex;
          } catch (InputException e) {
            System.out.println("by static type");
          } catch (Exception e) {
            System.out.println("by static type, wrong");
          }

          try {
            int zero = 0;
            System.out.println(5 / zero);
          } catch (ArithmeticException e) {
            System.out.println("arith");
          }
        }
      }
    `,
    expectedLines: [
      '1',
      '-1',
      '-2',
      '-2',
      '41',
      'app failure 7',
      '7',
      'AppException: app failure 7',
      'runtime unchecked',
      'pick failed',
      '5',
      '200',
      '100',
      '2',
      'rethrown 3',
      '12',
      'replaced',
      'nested 2',
      '1300',
      'use 3',
      'ctor -5',
      'npe',
      '203',
      'throwable',
      'by static type',
      'arith'
    ]
  },
  {
    comment: 'throw in loops, switch, constructors and inherited methods',
    program: `
      class Problem extends RuntimeException {
        public int level;
      }
      class Mild extends Problem { }
      class Severe extends Problem { }
      class Counter {
        int count;
        void tick(int limit) {
          count = count + 1;
          if (count > limit) {
            Severe s = new Severe();
            s.level = count;
            throw s;
          }
        }
      }
      class Account {
        int balance;
        Account() { }
        Account(int start) {
          if (start < 0) { throw new Mild(); }
          balance = start;
        }
        void withdraw(int amount) {
          if (amount > balance) {
            Problem p = new Problem();
            p.level = amount - balance;
            throw p;
          }
          balance = balance - amount;
        }
      }
      class SavingsAccount extends Account {
        SavingsAccount(int start) { }
        void withdraw(int amount) {
          if (amount > 100) { throw new Severe(); }
          super.withdraw(amount);
        }
      }
      public class Main {
        static int trace;

        static String classify(int code) {
          switch (code) {
            case 1:
              throw new Mild();
            case 2:
              throw new Severe();
            case 3:
              return "three";
            default:
              return "other";
          }
        }

        static int loops() {
          int handled = 0;
          for (int i = 0; i < 6; i++) {
            try {
              if (i == 1) { continue; }
              if (i == 4) { break; }
              if (i % 2 == 0) { throw new Mild(); }
              handled = handled + 100;
            } catch (Mild m) {
              handled = handled + 1;
            } finally {
              trace = trace + 1;
            }
          }
          return handled;
        }

        static void deep(int n) {
          if (n == 0) { throw new Severe(); }
          deep(n - 1);
        }

        public static void main(String[] args) {
          for (int c = 1; c <= 4; c++) {
            try {
              System.out.println(classify(c));
            } catch (Mild m) {
              System.out.println("mild");
            } catch (Problem p) {
              System.out.println("problem");
            }
          }

          System.out.println(loops());
          System.out.println(trace);

          Counter counter = new Counter();
          try {
            for (int i = 0; i < 10; i++) {
              counter.tick(3);
            }
          } catch (Severe s) {
            System.out.println("stopped at " + s.level);
          }
          System.out.println(counter.count);

          try {
            Account bad = new Account(-1);
            System.out.println("created");
          } catch (Mild m) {
            System.out.println("rejected");
          }
          Account acct = new Account(50);
          try {
            acct.withdraw(20);
            acct.withdraw(40);
          } catch (Problem p) {
            System.out.println("short by " + p.level);
          }
          System.out.println(acct.balance);

          SavingsAccount sav = new SavingsAccount(0);
          sav.balance = 500;
          try {
            sav.withdraw(50);
            sav.withdraw(150);
          } catch (Severe s) {
            System.out.println("too much");
          }
          System.out.println(sav.balance);
          try {
            sav.withdraw(600);
          } catch (Severe s) {
            System.out.println("wrong");
          } catch (Problem p) {
            System.out.println("overdrawn " + p.level);
          }

          try {
            deep(25);
          } catch (Problem p) {
            System.out.println("deep");
          }

          try {
            try {
              throw new Mild();
            } finally {
              System.out.println("cleanup");
            }
          } catch (Mild m) {
            System.out.println("after cleanup");
          }

          try {
            try {
              throw new Mild();
            } catch (Mild m) {
              throw new Severe();
            } finally {
              System.out.println("inner finally");
            }
          } catch (Severe s) {
            System.out.println("outer severe");
          }

          Problem keep = null;
          try {
            throw new Problem();
          } catch (Problem p) {
            keep = p;
          }
          System.out.println(keep == null);
          String msg = keep.getMessage();
          System.out.println(msg);
        }
      }
    `,
    expectedLines: [
      'mild',
      'problem',
      'three',
      'other',
      '102',
      '5',
      'stopped at 4',
      '4',
      'rejected',
      'short by 10',
      '30',
      'too much',
      '450',
      'wrong',
      'deep',
      'cleanup',
      'after cleanup',
      'inner finally',
      'outer severe',
      'false',
      'null'
    ]
  },
  {
    comment: 'multi-catch handles each alternative, with finally and rethrow',
    program: `
      class AppException extends Exception {
        public String getMessage() { return "app"; }
      }
      class InputException extends Exception {
        public String getMessage() { return "input"; }
      }
      class NetworkException extends Exception {
        public String getMessage() { return "network"; }
      }
      class SoftFailure extends RuntimeException { }
      class HardFailure extends Error { }
      public class Main {
        static int log;

        static void raise(int kind) throws AppException, InputException, NetworkException {
          if (kind == 1) { throw new AppException(); }
          if (kind == 2) { throw new InputException(); }
          if (kind == 3) { throw new NetworkException(); }
          if (kind == 4) { throw new SoftFailure(); }
          if (kind == 5) { throw new HardFailure(); }
        }

        static String attempt(int kind) {
          try {
            raise(kind);
            return "none";
          } catch (AppException | InputException e) {
            return "app-or-input " + e.getMessage();
          } catch (NetworkException e) {
            return "network " + e.getMessage();
          } catch (SoftFailure | HardFailure e) {
            return "unchecked " + e.toString();
          }
        }

        static String vmExceptions(int which) {
          try {
            int[] data = {1, 2};
            String text = null;
            if (which == 0) { return "" + (data[0] / (which)); }
            if (which == 1) { return "" + data[5]; }
            if (which == 2) { return "" + text.length(); }
            return "fine";
          } catch (ArithmeticException | ArrayIndexOutOfBoundsException e) {
            return "arith-or-index";
          } catch (NullPointerException e) {
            return "npe";
          }
        }

        static void rethrow(int kind) throws AppException, InputException {
          try {
            raise(kind);
          } catch (AppException | InputException e) {
            log = log + 1;
            throw e;
          } catch (NetworkException e) {
            log = log + 10;
          }
        }

        static int withFinally(int kind) {
          try {
            raise(kind);
            return 0;
          } catch (InputException | NetworkException e) {
            return 1;
          } catch (Exception e) {
            return 2;
          } finally {
            log = log + 100;
          }
        }

        static String describe(int kind) {
          try {
            raise(kind);
          } catch (AppException | InputException | NetworkException e) {
            Exception common = e;
            String text = e.toString();
            return text + " " + common.getMessage();
          }
          return "ok";
        }

        public static void main(String[] args) {
          for (int k = 0; k <= 5; k++) {
            System.out.println(attempt(k));
          }
          for (int w = 0; w <= 3; w++) {
            System.out.println(vmExceptions(w));
          }
          for (int k = 0; k <= 3; k++) {
            try {
              rethrow(k);
              System.out.println("returned " + k);
            } catch (AppException e) {
              System.out.println("rethrown app");
            } catch (InputException e) {
              System.out.println("rethrown input");
            }
          }
          System.out.println(log);
          log = 0;
          for (int k = 0; k <= 4; k++) {
            System.out.println(withFinally(k));
          }
          System.out.println(log);
          System.out.println(describe(0));
          System.out.println(describe(1));
          System.out.println(describe(2));
          System.out.println(describe(3));
          try {
            raise(2);
          } catch (AppException | InputException e) {
            System.out.println(e);
          } catch (NetworkException e) {
            System.out.println("no");
          }
        }
      }
    `,
    expectedLines: [
      'none',
      'app-or-input app',
      'app-or-input input',
      'network network',
      'unchecked SoftFailure',
      'unchecked HardFailure',
      'arith-or-index',
      'arith-or-index',
      'npe',
      'fine',
      'returned 0',
      'rethrown app',
      'rethrown input',
      'returned 3',
      '12',
      '0',
      '2',
      '1',
      '1',
      '2',
      '500',
      'ok',
      'AppException: app app',
      'InputException: input input',
      'NetworkException: network network',
      'InputException: input'
    ]
  },
  {
    comment:
      'a finally that completes abruptly discards the exception, and break and continue only run the finally blocks they leave',
    program: `
      class First extends RuntimeException { public String getMessage() { return "first"; } }
      class Second extends RuntimeException { public String getMessage() { return "second"; } }
      public class Main {
        static String trace = "";
        static int count;

        // --- a finally that completes abruptly discards the exception of the try or catch
        static void tryThrowsFinallyThrows() {
          try { throw new First(); } finally { throw new Second(); }
        }
        static void tryOkFinallyThrows() {
          try { trace = "ok"; } finally { throw new Second(); }
        }
        static void catchThrowsFinallyThrows() {
          try { throw new First(); } catch (First e) { throw new First(); } finally { throw new Second(); }
        }
        static int tryThrowsFinallyReturns() {
          try { throw new First(); } finally { return 7; }
        }
        static int catchThrowsFinallyReturns() {
          try { throw new First(); } catch (First e) { throw new First(); } finally { return 8; }
        }
        static int tryReturnsFinallyReturns() {
          try { return 1; } finally { return 2; }
        }
        static int tryReturnsFinallyThrows() {
          try { return 1; } finally { throw new Second(); }
        }
        static int tryReturnsFinallyNormal() {
          int x = 1;
          try { return x; } finally { x = 5; }
        }
        static int loopBreak() {
          int n = 0;
          for (int i = 0; i < 3; i++) {
            try { throw new First(); } finally { n = n + 1; break; }
          }
          return n;
        }
        static int loopContinue() {
          int n = 0;
          for (int i = 0; i < 3; i++) {
            try { throw new First(); } finally { n = n + 10; continue; }
          }
          return n;
        }
        static void nestedFinally() {
          try {
            try { throw new First(); } finally { trace = "inner"; }
          } finally {
            throw new Second();
          }
        }
        static void finallyThrowsCaughtOutside() {
          try {
            try { throw new First(); } finally { throw new Second(); }
          } catch (First e) {
            trace = "caught first";
          } catch (Second e) {
            trace = "caught second";
          }
        }
        static int returnInNestedFinally() {
          try {
            try { throw new First(); } finally { return 1; }
          } finally {
            trace = "outer ran";
          }
        }
        static int outerFinallyOverrides() {
          try {
            try { return 1; } finally { trace = "inner ran"; }
          } finally {
            return 2;
          }
        }

        // --- break and continue only run the finally blocks they leave
        static int breakInsideTry() {
          count = 0;
          try {
            for (int i = 0; i < 3; i++) {
              if (i == 1) { break; }
            }
            return 1;
          } finally {
            count = count + 1;
          }
        }
        static int continueInsideTry() {
          count = 0;
          try {
            for (int i = 0; i < 3; i++) {
              if (i == 1) { continue; }
              count = count + 10;
            }
            return 1;
          } finally {
            count = count + 100;
          }
        }
        static int finallyInsideLoop() {
          count = 0;
          for (int i = 0; i < 4; i++) {
            try {
              if (i == 1) { continue; }
              if (i == 3) { break; }
              count = count + 1;
            } finally {
              count = count + 100;
            }
          }
          return count;
        }
        static int twoLevels() {
          count = 0;
          try {
            for (int i = 0; i < 3; i++) {
              try {
                if (i == 0) { continue; }
                if (i == 2) { break; }
                count = count + 1;
              } finally {
                count = count + 10;
              }
            }
          } finally {
            count = count + 1000;
          }
          return count;
        }
        static int switchInsideTry(int k) {
          count = 0;
          try {
            switch (k) {
              case 1:
                count = count + 1;
                break;
              default:
                count = count + 2;
            }
            return count;
          } finally {
            count = count + 100;
          }
        }
        static int switchWithTryInside(int k) {
          count = 0;
          switch (k) {
            case 1:
              try {
                count = count + 1;
                break;
              } finally {
                count = count + 100;
              }
            default:
              count = count + 2;
          }
          return count;
        }
        static int returnThroughTwo() {
          count = 0;
          try {
            try {
              return 5;
            } finally {
              count = count + 1;
            }
          } finally {
            count = count + 10;
          }
        }

        // --- variables declared in a finally block
        static int variablesInFinally() {
          int total = 0;
          try {
            total = total + 1;
            return total;
          } catch (First e) {
            total = total + 100;
          } finally {
            int local = 5;
            total = total + local;
            count = total;
          }
          return -1;
        }
        static int variablesInNestedFinally(int mode) {
          int sum = 0;
          try {
            try {
              if (mode == 1) { throw new First(); }
              sum = sum + 1;
            } catch (First e) {
              sum = sum + 10;
            } finally {
              int a = 2;
              sum = sum + a;
            }
          } finally {
            int a = 200;
            sum = sum + a;
          }
          return sum;
        }
        static int loopWithFinallyVariable() {
          int sum = 0;
          for (int i = 0; i < 3; i++) {
            try {
              if (i == 1) { continue; }
              sum = sum + 1;
            } finally {
              int bonus = i * 10;
              sum = sum + bonus;
            }
          }
          return sum;
        }

        public static void main(String[] args) {
          try { tryThrowsFinallyThrows(); } catch (RuntimeException e) { System.out.println(e.getMessage()); }
          try { tryOkFinallyThrows(); } catch (RuntimeException e) { System.out.println(e.getMessage()); }
          try { catchThrowsFinallyThrows(); } catch (RuntimeException e) { System.out.println(e.getMessage()); }
          System.out.println(tryThrowsFinallyReturns());
          System.out.println(catchThrowsFinallyReturns());
          System.out.println(tryReturnsFinallyReturns());
          try { tryReturnsFinallyThrows(); } catch (RuntimeException e) { System.out.println(e.getMessage()); }
          System.out.println(tryReturnsFinallyNormal());
          System.out.println(loopBreak());
          System.out.println(loopContinue());
          try { nestedFinally(); } catch (RuntimeException e) { System.out.println(e.getMessage() + " " + trace); }
          finallyThrowsCaughtOutside();
          System.out.println(trace);
          System.out.println(returnInNestedFinally() + " " + trace);
          System.out.println(outerFinallyOverrides() + " " + trace);

          System.out.println(breakInsideTry() + " " + count);
          System.out.println(continueInsideTry() + " " + count);
          System.out.println(finallyInsideLoop());
          System.out.println(twoLevels());
          System.out.println(switchInsideTry(1) + " " + switchInsideTry(2));
          System.out.println(switchWithTryInside(1) + " " + switchWithTryInside(2));
          System.out.println(returnThroughTwo() + " " + count);

          System.out.println(variablesInFinally() + " " + count);
          System.out.println(variablesInNestedFinally(0) + " " + variablesInNestedFinally(1));
          System.out.println(loopWithFinallyVariable());
        }
      }
    `,
    expectedLines: [
      'second',
      'second',
      'second',
      '7',
      '8',
      '2',
      'second',
      '1',
      '1',
      '30',
      'second inner',
      'caught second',
      '1 outer ran',
      '2 inner ran',
      '1 1',
      '1 120',
      '402',
      '1031',
      '1 2',
      '101 2',
      '5 11',
      '1 6',
      '203 212',
      '32'
    ]
  },
  {
    comment:
      'the copy of a finally that a return, break or continue runs is not covered by the handlers of its own try',
    program: `
      class First extends RuntimeException { }
      class Second extends RuntimeException { }
      public class Main {
        static int runs;
        static String trace = "";

        // the finally runs once on the return path, and its exception is not caught by the same try
        static int returnThenFinallyThrows() {
          try {
            return 1;
          } catch (Second e) {
            trace = trace + "caught ";
            return 2;
          } finally {
            runs = runs + 1;
            throw new Second();
          }
        }
        static int returnThenFinallyThrowsNoCatch() {
          try {
            return 1;
          } finally {
            runs = runs + 1;
            throw new Second();
          }
        }
        static int breakThenFinallyThrows() {
          int n = 0;
          for (int i = 0; i < 3; i++) {
            try {
              break;
            } catch (Second e) {
              trace = trace + "caught-break ";
            } finally {
              runs = runs + 1;
              throw new Second();
            }
          }
          return n;
        }
        static int continueThenFinallyThrows() {
          for (int i = 0; i < 3; i++) {
            try {
              continue;
            } catch (Second e) {
              trace = trace + "caught-continue ";
            } finally {
              runs = runs + 1;
              throw new Second();
            }
          }
          return 0;
        }
        // an exception from a finally on a return path is caught by an enclosing try
        static int enclosingCatches() {
          try {
            try {
              return 1;
            } finally {
              runs = runs + 1;
              throw new First();
            }
          } catch (First e) {
            trace = trace + "outer-caught ";
            return 9;
          }
        }
        // a return inside a try nested in a try-catch: the inner finally's exception is covered by the outer catch
        static int innerFinallyThrowsOuterCatches() {
          try {
            try {
              return 1;
            } finally {
              runs = runs + 1;
              throw new Second();
            }
          } catch (Second e) {
            trace = trace + "outer-second ";
            return 3;
          } finally {
            runs = runs + 10;
          }
        }
        // the finally of an outer try is not covered by an inner try's catch
        static int outerFinallyNotCoveredByInnerCatch() {
          try {
            try {
              return 1;
            } catch (Second e) {
              trace = trace + "inner-caught ";
              return 4;
            }
          } finally {
            runs = runs + 1;
            throw new Second();
          }
        }

        static void run(int which) {
          runs = 0;
          trace = "";
          String result;
          try {
            int value = 0;
            if (which == 0) { value = returnThenFinallyThrows(); }
            if (which == 1) { value = returnThenFinallyThrowsNoCatch(); }
            if (which == 2) { value = breakThenFinallyThrows(); }
            if (which == 3) { value = continueThenFinallyThrows(); }
            if (which == 4) { value = enclosingCatches(); }
            if (which == 5) { value = innerFinallyThrowsOuterCatches(); }
            if (which == 6) { value = outerFinallyNotCoveredByInnerCatch(); }
            result = "value " + value;
          } catch (Second e) {
            result = "second";
          } catch (First e) {
            result = "first";
          }
          System.out.println(which + ": " + result + " runs=" + runs + " trace=" + trace);
        }

        public static void main(String[] args) {
          for (int w = 0; w <= 6; w++) { run(w); }
        }
      }
    `,
    expectedLines: [
      '0: second runs=1 trace=',
      '1: second runs=1 trace=',
      '2: second runs=1 trace=',
      '3: second runs=1 trace=',
      '4: value 9 runs=1 trace=outer-caught ',
      '5: value 3 runs=11 trace=outer-second ',
      '6: second runs=1 trace='
    ]
  }
]

const compileMethodBody = (body: string) => {
  const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
    allowedStartRules: ['CompilationUnit']
  })
  return compile(
    parser.parse(`
      class Mine extends RuntimeException { }
      class Sub extends Mine { }
      class MyError extends Error { }
      class Plain { }
      public class Main {
        static void x() { }
        public static void main(String[] args) {
          ${body}
        }
      }
    `) as AST
  )
}

export const throwTest = () =>
  describe('throw statement', () => {
    for (const { comment, program, expectedLines } of testCases) {
      it(comment, () => runTest(program, expectedLines))
    }

    describe('requires a Throwable', () => {
      const rejected: [string, string][] = [
        ['an int', 'int x = 1; throw x;'],
        ['an int literal', 'throw 1;'],
        ['a boolean', 'throw true;'],
        ['a double', 'throw 1.5;'],
        ['a char', "throw 'c';"],
        ['a String', 'String s = "s"; throw s;'],
        ['a string literal', 'throw "s";'],
        ['an Object', 'Object o = null; throw o;'],
        ['an Integer', 'Integer i = 1; throw i;'],
        ['an int array', 'int[] a = {1}; throw a;'],
        ['an exception array', 'RuntimeException[] a = {new RuntimeException()}; throw a;'],
        ['an instance of a class that is not an exception', 'throw new Object();'],
        ['an instance of a user class that is not an exception', 'throw new Plain();'],
        ['a variable of a user class that is not an exception', 'Plain p = new Plain(); throw p;'],
        ['a cast to Object', 'RuntimeException e = new RuntimeException(); throw (Object) e;'],
        ['a cast to a user class that is not an exception', 'Object o = null; throw (Plain) o;']
      ]
      for (const [comment, body] of rejected) {
        it(`rejects throwing ${comment}`, () =>
          expect(() => compileMethodBody(body)).toThrow(
            /incompatible types: .* cannot be converted to java.lang.Throwable/
          ))
      }

      const accepted: [string, string][] = [
        ['null', 'throw null;'],
        ['a new user exception', 'throw new Mine();'],
        ['a new subclass of a user exception', 'throw new Sub();'],
        ['a user error', 'throw new MyError();'],
        ['a variable of a user exception', 'Mine m = new Mine(); throw m;'],
        ['a variable of a superclass', 'RuntimeException r = new Mine(); throw r;'],
        ['a new library exception', 'throw new RuntimeException();'],
        ['a new library subclass', 'throw new IllegalStateException();'],
        ['a new arithmetic exception', 'throw new ArithmeticException();'],
        ['a cast to an unchecked exception', 'RuntimeException r = new Mine(); throw (Mine) r;'],
        [
          'a conditional of exceptions',
          'int x = 1; Mine m = new Mine(); RuntimeException r = new Mine(); throw x > 0 ? m : r;'
        ],
        ['a statement in a branch', 'int x = 1; if (x > 0) throw new Mine();'],
        [
          'both branches of an if',
          'int x = 1; if (x > 0) { throw new Mine(); } else { throw new MyError(); }'
        ],
        ['a loop body', 'int x = 1; while (x > 0) { throw new Mine(); }'],
        ['a try block with a catch', 'try { throw new Mine(); } catch (Mine e) { x(); }'],
        [
          'a rethrow of the caught exception',
          'try { throw new Mine(); } catch (Mine e) { throw e; }'
        ],
        ['a try block with a finally', 'try { throw new Mine(); } finally { x(); }'],
        ['a loop without a condition', 'Mine m = new Mine(); for (;;) { throw m; }']
      ]
      for (const [comment, body] of accepted) {
        it(`accepts throwing ${comment}`, () => expect(() => compileMethodBody(body)).not.toThrow())
      }
    })
    describe('checked exceptions', () => {
      const compileClasses = (extra: string, body: string, throwsClause: string) => {
        const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
          allowedStartRules: ['CompilationUnit']
        })
        return compile(
          parser.parse(`
            import java.io.*;
            class AppEx extends Exception { }
            class SubEx extends AppEx { }
            class OtherEx extends Exception { }
            class RtEx extends RuntimeException { }
            class MyErr extends Error { }
            class Svc {
              Svc() { }
              Svc(int x) throws AppEx { }
              void risky() throws AppEx { throw new AppEx(); }
              void two() throws AppEx, OtherEx { }
              void safe() { }
              static void sRisky() throws SubEx { }
            }
            class P { P() throws AppEx { } }
            ${extra}
            public class Main {
              static void t() ${throwsClause} {
                Svc s = new Svc();
                Object o = new Object();
                boolean b = true;
                ${body}
              }
              public static void main(String[] args) { }
            }
          `) as AST
        )
      }

      // [comment, other classes, body of a method, its throws clause, the error or undefined]
      const cases: [string, string, string, string, RegExp | undefined][] = [
        [
          'throwing a checked exception without declaring it',
          '',
          'throw new AppEx();',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'throwing a checked exception that the method declares',
          '',
          'throw new AppEx();',
          'throws AppEx',
          undefined
        ],
        [
          'throwing a checked exception that a superclass is declared for',
          '',
          'throw new AppEx();',
          'throws Exception',
          undefined
        ],
        [
          'throwing a checked exception that Throwable is declared for',
          '',
          'throw new AppEx();',
          'throws Throwable',
          undefined
        ],
        [
          'throwing a checked exception when only a subclass is declared',
          '',
          'throw new AppEx();',
          'throws SubEx',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'throwing a subclass of the declared exception',
          '',
          'throw new SubEx();',
          'throws AppEx',
          undefined
        ],
        ['throwing an unchecked exception', '', 'throw new RtEx();', '', undefined],
        ['throwing an error', '', 'throw new MyErr();', '', undefined],
        [
          'throwing a library checked exception',
          '',
          'throw new Exception();',
          '',
          /unreported exception Exception; must be caught or declared to be thrown/
        ],
        [
          'throwing Throwable',
          '',
          'throw new Throwable();',
          '',
          /unreported exception Throwable; must be caught or declared to be thrown/
        ],
        [
          'throwing a variable of a checked type',
          '',
          'Exception e = new Exception(); throw e;',
          '',
          /unreported exception Exception; must be caught or declared to be thrown/
        ],
        [
          'throwing a checked exception from a conditional',
          '',
          'if (b) throw new AppEx();',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'throwing a checked exception in a loop',
          '',
          'while (b) { throw new AppEx(); }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'throwing a checked exception in a switch',
          '',
          'int x = 1; switch (x) { case 1: throw new AppEx(); default: break; }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'throwing the common class of a conditional',
          '',
          'throw b ? new AppEx() : new OtherEx();',
          '',
          /unreported exception Exception; must be caught or declared to be thrown/
        ],
        ['throwing null', '', 'throw null;', '', undefined],
        [
          'declaring an unchecked exception that is thrown',
          '',
          'throw new RtEx();',
          'throws AppEx',
          undefined
        ],
        [
          'calling a method that throws, without declaring it',
          '',
          's.risky();',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        ['calling a method that throws, declared', '', 's.risky();', 'throws AppEx', undefined],
        [
          'calling a method that throws, declared as Exception',
          '',
          's.risky();',
          'throws Exception',
          undefined
        ],
        [
          'calling a method that throws, declared as something else',
          '',
          's.risky();',
          'throws OtherEx',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'calling a method that throws two exceptions, declaring one',
          '',
          's.two();',
          'throws AppEx',
          /unreported exception OtherEx; must be caught or declared to be thrown/
        ],
        [
          'calling a method that throws two exceptions, declaring both',
          '',
          's.two();',
          'throws AppEx, OtherEx',
          undefined
        ],
        ['calling a method that throws nothing', '', 's.safe();', '', undefined],
        [
          'calling a static method that throws',
          '',
          'Svc.sRisky();',
          '',
          /unreported exception SubEx; must be caught or declared to be thrown/
        ],
        [
          'calling a static method that throws, declared by a superclass',
          '',
          'Svc.sRisky();',
          'throws AppEx',
          undefined
        ],
        [
          'calling a constructor that throws',
          '',
          'Svc t = new Svc(1);',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'calling a constructor that throws, declared',
          '',
          'Svc t = new Svc(1);',
          'throws AppEx',
          undefined
        ],
        ['calling a constructor that throws nothing', '', 'Svc t = new Svc();', '', undefined],
        [
          'calling a method of the same class that throws',
          'class M1 { void a() throws AppEx { } void b() { a(); } }',
          '',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'calling a method of the same class that throws, declared',
          'class M2 { void a() throws AppEx { } void b() throws AppEx { a(); } }',
          '',
          '',
          undefined
        ],
        [
          'calling a static method of the same class that throws',
          'class M3 { static void a() throws AppEx { } static void b() { a(); } }',
          '',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'calling a method through this',
          'class M4 { void a() throws AppEx { } void b() { this.a(); } }',
          '',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'calling a super method that throws, declared',
          'class M5 { void a() throws AppEx { } } class M6 extends M5 { void a() throws AppEx { super.a(); } }',
          '',
          '',
          undefined
        ],
        [
          'calling a super method that throws',
          'class M7 { void a() throws AppEx { } } class M8 extends M7 { void a() throws AppEx { } void c() { super.a(); } }',
          '',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a method that returns a value and throws',
          'class R1 { int f(int x) throws AppEx { if (x > 0) { return x; } throw new AppEx(); } }',
          '',
          '',
          undefined
        ],
        [
          'a method that returns a value and throws, undeclared',
          'class R2 { int f(int x) { if (x > 0) { return x; } throw new AppEx(); } }',
          '',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'catching the exception that is thrown',
          '',
          'try { s.risky(); } catch (AppEx e) { }',
          '',
          undefined
        ],
        [
          'catching a superclass of the exception that is thrown',
          '',
          'try { s.risky(); } catch (Exception e) { }',
          '',
          undefined
        ],
        ['catching Throwable', '', 'try { s.risky(); } catch (Throwable e) { }', '', undefined],
        [
          'catching only a subclass of the exception that is thrown',
          '',
          'try { s.risky(); } catch (SubEx e) { }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'catching an unrelated checked exception',
          '',
          'try { s.risky(); } catch (OtherEx e) { }',
          '',
          /exception OtherEx is never thrown in body of corresponding try statement/
        ],
        [
          'catching an unchecked exception does not catch a checked one',
          '',
          'try { s.risky(); } catch (RtEx e) { }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a try with only a finally does not catch',
          '',
          'try { s.risky(); } finally { }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a try with only a finally, declared',
          '',
          'try { s.risky(); } finally { }',
          'throws AppEx',
          undefined
        ],
        [
          'catching a checked exception that is never thrown',
          '',
          'try { s.safe(); } catch (AppEx e) { }',
          '',
          /exception AppEx is never thrown in body of corresponding try statement/
        ],
        [
          'catching a checked exception in an empty try',
          '',
          'try { } catch (AppEx e) { }',
          '',
          /exception AppEx is never thrown in body of corresponding try statement/
        ],
        [
          'catching Exception when nothing is thrown',
          '',
          'try { s.safe(); } catch (Exception e) { }',
          '',
          undefined
        ],
        [
          'catching Throwable when nothing is thrown',
          '',
          'try { s.safe(); } catch (Throwable e) { }',
          '',
          undefined
        ],
        [
          'catching an unchecked exception when nothing is thrown',
          '',
          'try { s.safe(); } catch (RtEx e) { }',
          '',
          undefined
        ],
        [
          'catching an error when nothing is thrown',
          '',
          'try { s.safe(); } catch (MyErr e) { }',
          '',
          undefined
        ],
        [
          'a catch that rethrows what it caught',
          '',
          'try { s.risky(); } catch (AppEx e) { throw e; }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a catch that rethrows what it caught, declared',
          '',
          'try { s.risky(); } catch (AppEx e) { throw e; }',
          'throws AppEx',
          undefined
        ],
        [
          'a catch that throws another checked exception',
          '',
          'try { s.risky(); } catch (AppEx e) { throw new OtherEx(); }',
          '',
          /unreported exception OtherEx; must be caught or declared to be thrown/
        ],
        [
          'a catch that throws another checked exception, declared',
          '',
          'try { s.risky(); } catch (AppEx e) { throw new OtherEx(); }',
          'throws OtherEx',
          undefined
        ],
        [
          'catching only one of two exceptions',
          '',
          'try { s.two(); } catch (AppEx e) { }',
          '',
          /unreported exception OtherEx; must be caught or declared to be thrown/
        ],
        [
          'catching both of two exceptions',
          '',
          'try { s.two(); } catch (AppEx e) { } catch (OtherEx e) { }',
          '',
          undefined
        ],
        [
          'a call in a catch is not covered by its sibling catches',
          '',
          'try { s.risky(); } catch (AppEx e) { s.two(); } catch (OtherEx e) { }',
          '',
          /exception OtherEx is never thrown in body of corresponding try statement/
        ],
        [
          'a call in a catch, declared',
          '',
          'try { s.risky(); } catch (AppEx e) { s.two(); }',
          'throws AppEx, OtherEx',
          undefined
        ],
        [
          'a call in a finally',
          '',
          'try { s.safe(); } finally { s.risky(); }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a call in a finally, declared',
          '',
          'try { s.safe(); } finally { s.risky(); }',
          'throws AppEx',
          undefined
        ],
        [
          'nested try blocks',
          '',
          'try { try { s.risky(); } finally { } } catch (AppEx e) { }',
          '',
          undefined
        ],
        [
          'a nested catch that is never thrown',
          '',
          'try { try { s.risky(); } catch (OtherEx e) { } } catch (AppEx e) { }',
          '',
          /exception OtherEx is never thrown in body of corresponding try statement/
        ],
        [
          'a try inside a catch',
          '',
          'try { s.risky(); } catch (AppEx e) { try { s.risky(); } catch (AppEx e2) { } }',
          '',
          undefined
        ],
        [
          'a catch type that is not a Throwable',
          '',
          'try { s.risky(); } catch (String e) { }',
          '',
          /incompatible types: .* cannot be converted to java.lang.Throwable/
        ],
        [
          'rethrowing Exception when the try throws a checked exception',
          '',
          'try { throw new AppEx(); } catch (Exception e) { throw e; }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'rethrowing Exception when the try throws a checked exception, declared',
          '',
          'try { throw new AppEx(); } catch (Exception e) { throw e; }',
          'throws AppEx',
          undefined
        ],
        [
          'rethrowing Exception when the try throws nothing checked',
          '',
          'try { s.safe(); } catch (Exception e) { throw e; }',
          '',
          undefined
        ],
        [
          'rethrowing Throwable when the try throws nothing checked',
          '',
          'try { s.safe(); } catch (Throwable t) { throw t; }',
          '',
          undefined
        ],
        [
          'rethrowing a reassigned parameter',
          '',
          'try { s.safe(); } catch (Exception e) { e = new Exception(); throw e; }',
          '',
          /unreported exception Exception; must be caught or declared to be thrown/
        ],
        [
          'rethrowing Exception when the try calls a throwing method',
          '',
          'try { s.risky(); } catch (Exception e) { throw e; }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'rethrowing Exception when the declared type is a subclass',
          '',
          'try { s.risky(); } catch (Exception e) { throw e; }',
          'throws SubEx',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'rethrowing only the exceptions that the try throws',
          '',
          'try { s.two(); } catch (Exception e) { throw e; }',
          'throws AppEx',
          /unreported exception OtherEx; must be caught or declared to be thrown/
        ],
        [
          'rethrowing both exceptions that the try throws',
          '',
          'try { s.two(); } catch (Exception e) { throw e; }',
          'throws AppEx, OtherEx',
          undefined
        ],
        [
          'rethrowing what earlier catches did not catch',
          '',
          'try { s.two(); } catch (AppEx a) { } catch (Exception e) { throw e; }',
          'throws OtherEx',
          undefined
        ],
        [
          'rethrowing after catching the subclass first',
          '',
          'try { s.risky(); } catch (SubEx e) { throw e; } catch (AppEx e) { throw e; }',
          'throws AppEx',
          undefined
        ],
        [
          'a multi-catch of both exceptions that are thrown',
          '',
          'try { s.two(); } catch (AppEx | OtherEx e) { }',
          '',
          undefined
        ],
        [
          'a multi-catch with an exception that is never thrown',
          '',
          'try { s.risky(); } catch (AppEx | OtherEx e) { }',
          '',
          /exception OtherEx is never thrown in body of corresponding try statement/
        ],
        [
          'a multi-catch of related classes',
          '',
          'try { s.risky(); } catch (AppEx | SubEx e) { }',
          '',
          /Alternatives in a multi-catch statement cannot be related by subclassing/
        ],
        [
          'a multi-catch of related classes, reversed',
          '',
          'try { s.risky(); } catch (SubEx | AppEx e) { }',
          '',
          /Alternatives in a multi-catch statement cannot be related by subclassing/
        ],
        [
          'a multi-catch of unchecked exceptions',
          '',
          'try { s.safe(); } catch (RtEx | MyErr e) { }',
          '',
          undefined
        ],
        [
          'a multi-catch of a checked and an unchecked exception',
          '',
          'try { s.risky(); } catch (AppEx | RtEx e) { }',
          '',
          undefined
        ],
        [
          'a multi-catch with a type that is not a Throwable',
          '',
          'try { s.risky(); } catch (String | AppEx e) { }',
          '',
          /incompatible types: .* cannot be converted to java.lang.Throwable/
        ],
        [
          'calling a method on a multi-catch parameter',
          '',
          'try { s.two(); } catch (AppEx | OtherEx e) { String m = e.getMessage(); }',
          '',
          undefined
        ],
        [
          'rethrowing a multi-catch parameter, declared',
          '',
          'try { s.two(); } catch (AppEx | OtherEx e) { throw e; }',
          'throws AppEx, OtherEx',
          undefined
        ],
        [
          'rethrowing a multi-catch parameter, undeclared',
          '',
          'try { s.two(); } catch (AppEx | OtherEx e) { throw e; }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'rethrowing a multi-catch parameter, declaring one',
          '',
          'try { s.two(); } catch (AppEx | OtherEx e) { throw e; }',
          'throws AppEx',
          /unreported exception OtherEx; must be caught or declared to be thrown/
        ],
        [
          'rethrowing an unchecked multi-catch parameter',
          '',
          'try { s.safe(); } catch (RtEx | MyErr e) { throw e; }',
          '',
          undefined
        ],
        [
          'assigning to a multi-catch parameter',
          '',
          'try { s.safe(); } catch (RtEx | MyErr e) { e = null; }',
          '',
          /multi-catch parameter e may not be assigned/
        ],
        [
          'assigning to an ordinary catch parameter',
          '',
          'try { s.safe(); } catch (RtEx e) { e = null; }',
          '',
          undefined
        ],
        [
          'a multi-catch followed by another catch',
          '',
          'try { s.two(); } catch (AppEx | OtherEx e) { } catch (RtEx e) { }',
          '',
          undefined
        ],
        [
          'a library method that throws a checked exception',
          '',
          'o.wait();',
          '',
          /unreported exception InterruptedException; must be caught or declared to be thrown/
        ],
        [
          'a library method that throws a checked exception, caught',
          '',
          'try { o.wait(); } catch (InterruptedException e) { }',
          '',
          undefined
        ],
        [
          'a library method that throws a checked exception, declared',
          '',
          'o.wait();',
          'throws InterruptedException',
          undefined
        ],
        [
          'a library method that throws an IOException subclass',
          '',
          'String str = "a"; byte[] x = str.getBytes("UTF-8");',
          '',
          /unreported exception UnsupportedEncodingException; must be caught or declared to be thrown/
        ],
        [
          'a library method that throws an IOException subclass, caught',
          '',
          'String str = "a"; try { byte[] x = str.getBytes("UTF-8"); } catch (UnsupportedEncodingException e) { }',
          '',
          undefined
        ],
        [
          'a library method that throws an IOException subclass, caught as IOException',
          '',
          'String str = "a"; try { byte[] x = str.getBytes("UTF-8"); } catch (IOException e) { }',
          '',
          undefined
        ],
        [
          'catching an IOException subclass that is not thrown',
          '',
          'String str = "a"; try { byte[] x = str.getBytes("UTF-8"); } catch (FileNotFoundException e) { }',
          '',
          /exception FileNotFoundException is never thrown in body of corresponding try statement/
        ],
        [
          'a library method that throws an unchecked exception',
          '',
          'int x = Integer.parseInt("1");',
          '',
          undefined
        ],
        [
          'a constructor that calls a throwing constructor',
          'class C1 { C1() { new Svc(1); } }',
          '',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a constructor that calls a throwing constructor, declared',
          'class C2 { C2() throws AppEx { new Svc(1); } }',
          '',
          '',
          undefined
        ],
        [
          'an implicit super() that throws, explicit constructor',
          'class Q1 extends P { Q1() { } }',
          '',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'an implicit super() that throws, constructor declares it',
          'class Q2 extends P { Q2() throws AppEx { } }',
          '',
          '',
          undefined
        ],
        [
          'an implicit super() that throws, default constructor',
          'class Q3 extends P { }',
          '',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'an implicit super() that throws, constructor declares a superclass',
          'class Q4 extends P { Q4() throws Exception { } }',
          '',
          '',
          undefined
        ],
        [
          'a field initializer that throws',
          'class F1 { Svc t = new Svc(1); }',
          '',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a field initializer that throws, constructor declares it',
          'class F2 { F2() throws AppEx { } Svc t = new Svc(1); }',
          '',
          '',
          undefined
        ],
        [
          'a field initializer that throws, one constructor does not declare it',
          'class F3 { F3() throws AppEx { } F3(int x) { } Svc t = new Svc(1); }',
          '',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a static field initializer that throws',
          'class G1 { static Svc t = new Svc(1); }',
          '',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'an override that throws a broader exception',
          'class A1 { void f() throws AppEx { } } class B1 extends A1 { void f() throws OtherEx { } }',
          '',
          '',
          /f\(\) in B1 cannot override f\(\) in A1; overridden method does not throw OtherEx/
        ],
        [
          'an override that throws a subclass',
          'class A2 { void f() throws AppEx { } } class B2 extends A2 { void f() throws SubEx { } }',
          '',
          '',
          undefined
        ],
        [
          'an override that throws nothing',
          'class A3 { void f() throws AppEx { } } class B3 extends A3 { void f() { } }',
          '',
          '',
          undefined
        ],
        [
          'an override that throws Exception',
          'class A4 { void f() throws AppEx { } } class B4 extends A4 { void f() throws Exception { } }',
          '',
          '',
          /overridden method does not throw Exception/
        ],
        [
          'an override that throws an unchecked exception',
          'class A5 { void f() { } } class B5 extends A5 { void f() throws RtEx { } }',
          '',
          '',
          undefined
        ],
        [
          'an override that adds a checked exception',
          'class A6 { void f() { } } class B6 extends A6 { void f() throws AppEx { } }',
          '',
          '',
          /overridden method does not throw AppEx/
        ],
        [
          'an override that throws the same exception',
          'class A7 { void f() throws AppEx { } } class B7 extends A7 { void f() throws AppEx { } }',
          '',
          '',
          undefined
        ],
        [
          'an override of a library method that adds a checked exception',
          'class T1 { public String toString() throws AppEx { return ""; } }',
          '',
          '',
          /toString\(\) in T1 cannot override toString\(\) in Object; overridden method does not throw AppEx/
        ],
        [
          'an override of a library method that throws Throwable',
          'class T2 { protected void finalize() throws Throwable { } }',
          '',
          '',
          undefined
        ],
        [
          'a throws clause naming a class that is not a Throwable',
          'class N1 { void f() throws String { } }',
          '',
          '',
          /incompatible types: .* cannot be converted to java.lang.Throwable/
        ],
        [
          'a throws clause naming an unchecked exception',
          'class N2 { void f() throws RtEx { } }',
          '',
          '',
          undefined
        ],
        [
          'catching the same exception class twice',
          '',
          'try { s.risky(); } catch (AppEx e) { } catch (AppEx e) { }',
          '',
          /exception AppEx has already been caught/
        ],
        [
          'catching the same unchecked exception class twice',
          '',
          'try { s.safe(); } catch (RtEx e) { } catch (RtEx e) { }',
          '',
          /exception RtEx has already been caught/
        ],
        [
          'catching Exception twice',
          '',
          'try { s.safe(); } catch (Exception e) { } catch (Exception e) { }',
          '',
          /exception Exception has already been caught/
        ],
        [
          'catching a subclass after its superclass',
          '',
          'try { s.risky(); } catch (AppEx e) { } catch (SubEx e) { }',
          '',
          /exception SubEx has already been caught/
        ],
        [
          'catching a subclass two levels down after its superclass',
          'class DeepEx extends SubEx { } class RtSub extends RtEx { } class Deep { void deep() throws DeepEx { } }',
          'Deep d = new Deep(); try { d.deep(); } catch (AppEx e) { } catch (DeepEx e) { }',
          '',
          /exception DeepEx has already been caught/
        ],
        [
          'catching a subclass after its direct superclass',
          'class DeepEx extends SubEx { } class RtSub extends RtEx { } class Deep { void deep() throws DeepEx { } }',
          'Deep d = new Deep(); try { d.deep(); } catch (SubEx e) { } catch (DeepEx e) { }',
          '',
          /exception DeepEx has already been caught/
        ],
        [
          'catching a class after Exception',
          '',
          'try { s.risky(); } catch (Exception e) { } catch (AppEx e) { }',
          '',
          /exception AppEx has already been caught/
        ],
        [
          'catching Exception after Throwable',
          '',
          'try { s.risky(); } catch (Throwable e) { } catch (Exception e) { }',
          '',
          /exception Exception has already been caught/
        ],
        [
          'catching RuntimeException after Exception',
          '',
          'try { s.safe(); } catch (Exception e) { } catch (RuntimeException e) { }',
          '',
          /exception RuntimeException has already been caught/
        ],
        [
          'catching a user unchecked subclass after its superclass',
          'class DeepEx extends SubEx { } class RtSub extends RtEx { } class Deep { void deep() throws DeepEx { } }',
          'try { s.safe(); } catch (RtEx e) { } catch (RtSub e) { }',
          '',
          /exception RtSub has already been caught/
        ],
        [
          'catching an error after Throwable',
          '',
          'try { s.safe(); } catch (Throwable e) { } catch (MyErr e) { }',
          '',
          /exception MyErr has already been caught/
        ],
        [
          'catching a library exception after its superclass',
          '',
          'try { s.safe(); } catch (RuntimeException e) { } catch (ArithmeticException e) { }',
          '',
          /exception ArithmeticException has already been caught/
        ],
        [
          'catching a library subclass after Exception',
          '',
          'try { s.safe(); } catch (Exception e) { } catch (IllegalStateException e) { }',
          '',
          /exception IllegalStateException has already been caught/
        ],
        [
          'catching a subclass in the third clause',
          '',
          'try { s.two(); } catch (AppEx e) { } catch (OtherEx e) { } catch (SubEx e) { }',
          '',
          /exception SubEx has already been caught/
        ],
        [
          'catching a subclass of an earlier clause after an unrelated one',
          '',
          'try { s.risky(); } catch (RtEx e) { } catch (AppEx e) { } catch (SubEx e) { }',
          '',
          /exception SubEx has already been caught/
        ],
        [
          'catching a subclass of a multi-catch alternative',
          '',
          'try { s.two(); } catch (AppEx | OtherEx e) { } catch (SubEx e) { }',
          '',
          /exception SubEx has already been caught/
        ],
        [
          'catching an alternative of an earlier multi-catch',
          '',
          'try { s.two(); } catch (AppEx | OtherEx e) { } catch (OtherEx e) { }',
          '',
          /exception OtherEx has already been caught/
        ],
        [
          'a multi-catch with an alternative that is already caught',
          '',
          'try { s.two(); } catch (AppEx e) { } catch (SubEx | OtherEx e) { }',
          '',
          /exception SubEx has already been caught/
        ],
        [
          'a multi-catch with a subclass of an earlier unchecked clause',
          'class DeepEx extends SubEx { } class RtSub extends RtEx { } class Deep { void deep() throws DeepEx { } }',
          'try { s.safe(); } catch (RtEx | MyErr e) { } catch (RtSub e) { }',
          '',
          /exception RtSub has already been caught/
        ],
        [
          'a multi-catch whose alternative repeats an earlier multi-catch',
          '',
          'try { s.safe(); } catch (RtEx | MyErr e) { } catch (RtEx | OtherEx e) { }',
          '',
          /exception RtEx has already been caught/
        ],
        [
          'an already caught clause with a finally',
          '',
          'try { s.risky(); } catch (AppEx e) { } catch (SubEx e) { } finally { }',
          '',
          /exception SubEx has already been caught/
        ],
        [
          'an already caught clause in a try inside a catch',
          '',
          'try { s.risky(); } catch (AppEx e) { try { s.risky(); } catch (AppEx e2) { } catch (SubEx e2) { } }',
          '',
          /exception SubEx has already been caught/
        ],
        [
          'catching a library subclass after its superclass',
          '',
          'try { int x = Integer.parseInt("1"); } catch (IllegalArgumentException e) { } catch (NumberFormatException e) { }',
          '',
          /exception NumberFormatException has already been caught/
        ],
        [
          'catching a checked library exception after Exception',
          '',
          'try { o.wait(); } catch (Exception e) { } catch (InterruptedException e) { }',
          '',
          /exception InterruptedException has already been caught/
        ],
        [
          'catching the superclass after the subclass',
          'class DeepEx extends SubEx { } class RtSub extends RtEx { } class Deep { void deep() throws DeepEx { } }',
          'Deep d = new Deep(); try { d.deep(); } catch (DeepEx e) { } catch (SubEx e) { } catch (AppEx e) { }',
          '',
          undefined
        ],
        [
          'catching the direct superclass after the subclass',
          '',
          'try { s.risky(); } catch (SubEx e) { } catch (AppEx e) { }',
          '',
          undefined
        ],
        [
          'catching an unchecked superclass after the subclass',
          'class DeepEx extends SubEx { } class RtSub extends RtEx { } class Deep { void deep() throws DeepEx { } }',
          'try { s.safe(); } catch (RtSub e) { } catch (RtEx e) { }',
          '',
          undefined
        ],
        [
          'catching library exceptions from the most to the least specific',
          '',
          'try { s.safe(); } catch (ArithmeticException e) { } catch (RuntimeException e) { } catch (Exception e) { } catch (Throwable t) { }',
          '',
          undefined
        ],
        [
          'catching an error before Throwable',
          '',
          'try { s.safe(); } catch (MyErr e) { } catch (Error e) { } catch (Throwable t) { }',
          '',
          undefined
        ],
        [
          'catching unrelated exceptions',
          '',
          'try { s.two(); } catch (AppEx e) { } catch (OtherEx e) { }',
          '',
          undefined
        ],
        [
          'catching an unchecked exception and an error',
          '',
          'try { s.safe(); } catch (RtEx e) { } catch (MyErr e) { }',
          '',
          undefined
        ],
        [
          'catching an unchecked exception, an error and then Exception',
          '',
          'try { s.safe(); } catch (RtEx e) { } catch (MyErr e) { } catch (Exception e) { }',
          '',
          undefined
        ],
        [
          'catching an error before an unchecked exception',
          '',
          'try { s.safe(); } catch (Error e) { } catch (RuntimeException e) { }',
          '',
          undefined
        ],
        [
          'a multi-catch followed by a superclass of its alternatives',
          '',
          'try { s.safe(); } catch (RtEx | MyErr e) { } catch (Exception e) { }',
          '',
          undefined
        ],
        [
          'a multi-catch followed by a superclass of one alternative',
          '',
          'try { s.safe(); } catch (RtEx | MyErr e) { } catch (Error e) { }',
          '',
          undefined
        ],
        [
          'a multi-catch of subclasses followed by their superclass',
          'class DeepEx extends SubEx { } class RtSub extends RtEx { } class Deep { void deep() throws DeepEx { } }',
          'try { s.safe(); } catch (RtSub | MyErr e) { } catch (RtEx e) { }',
          '',
          undefined
        ],
        [
          'a multi-catch of subclasses followed by a superclass',
          '',
          'try { s.two(); } catch (SubEx | OtherEx e) { } catch (AppEx e) { }',
          '',
          undefined
        ],
        [
          'the same class in clauses of different try statements',
          '',
          'try { s.risky(); } catch (AppEx e) { } try { s.risky(); } catch (AppEx e) { }',
          '',
          undefined
        ],
        [
          'catching in an outer try what an inner try already caught',
          '',
          'try { try { s.risky(); } catch (AppEx e) { } } catch (AppEx e) { }',
          '',
          /exception AppEx is never thrown in body of corresponding try statement/
        ],
        [
          'a finally that returns discards the exception of the try',
          '',
          'try { throw new AppEx(); } finally { return; }',
          '',
          undefined
        ],
        [
          'a finally that returns discards the exception of a call in the try',
          '',
          'try { s.risky(); } finally { return; }',
          '',
          undefined
        ],
        [
          'a finally that throws an unchecked exception discards the checked one of the try',
          '',
          'try { throw new AppEx(); } finally { throw new RtEx(); }',
          '',
          undefined
        ],
        [
          'a finally that throws the same checked exception still needs it declared',
          '',
          'try { throw new AppEx(); } finally { throw new AppEx(); }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'only the exception of the finally needs to be declared',
          '',
          'try { throw new AppEx(); } finally { throw new OtherEx(); }',
          'throws OtherEx',
          undefined
        ],
        [
          'the exception of the finally is not covered by declaring the one of the try',
          '',
          'try { throw new AppEx(); } finally { throw new OtherEx(); }',
          'throws AppEx',
          /unreported exception OtherEx; must be caught or declared to be thrown/
        ],
        [
          'a finally that returns discards the exception of a catch',
          '',
          'try { s.safe(); } catch (RtEx e) { throw new AppEx(); } finally { return; }',
          '',
          undefined
        ],
        [
          'a finally that returns discards the exceptions of the try and a catch',
          '',
          'try { s.risky(); } catch (AppEx e) { throw new OtherEx(); } finally { return; }',
          '',
          undefined
        ],
        [
          'a finally that throws discards the exceptions of calls in the try and a catch',
          '',
          'try { s.two(); } catch (AppEx e) { s.risky(); } finally { throw new RtEx(); }',
          '',
          undefined
        ],
        [
          'a finally that returns in both branches of an if-else',
          '',
          'try { s.risky(); } finally { if (true) { return; } else { return; } }',
          '',
          undefined
        ],
        [
          'a finally that returns inside a nested block',
          '',
          'try { s.risky(); } finally { { return; } }',
          '',
          undefined
        ],
        [
          'a finally with a nested try whose finally returns',
          '',
          'try { s.risky(); } finally { try { s.safe(); } finally { return; } }',
          '',
          undefined
        ],
        [
          'a finally with an infinite while loop',
          '',
          'try { s.risky(); } finally { while (true) { } }',
          '',
          undefined
        ],
        [
          'a finally with an infinite for loop',
          '',
          'try { s.risky(); } finally { for (;;) { } }',
          '',
          undefined
        ],
        [
          'a finally with a statement and then a return',
          '',
          'try { s.risky(); } finally { s.safe(); return; }',
          '',
          undefined
        ],
        [
          'a finally with a try-catch whose try returns and whose catch returns',
          '',
          'try { s.risky(); } finally { try { return; } catch (RtEx e) { return; } }',
          '',
          undefined
        ],
        [
          'a finally with a try whose catch and finally return',
          '',
          'try { s.risky(); } finally { try { s.safe(); } catch (RtEx e) { s.safe(); } finally { return; } }',
          '',
          undefined
        ],
        [
          'a finally that breaks out of a loop',
          '',
          'for (int i = 0; i < 2; i++) { try { s.risky(); } finally { break; } }',
          '',
          undefined
        ],
        [
          'a finally that continues a loop',
          '',
          'for (int i = 0; i < 2; i++) { try { s.risky(); } finally { continue; } }',
          '',
          undefined
        ],
        [
          'a catch that swallows the exception and a finally that returns',
          '',
          'try { s.risky(); } catch (AppEx e) { } finally { return; }',
          '',
          undefined
        ],
        [
          'a finally that throws a checked exception when the try is handled',
          '',
          'try { s.risky(); } catch (AppEx e) { } finally { throw new OtherEx(); }',
          '',
          /unreported exception OtherEx; must be caught or declared to be thrown/
        ],
        [
          'a finally that throws a checked exception when the try is handled, declared',
          '',
          'try { s.risky(); } catch (AppEx e) { } finally { throw new OtherEx(); }',
          'throws OtherEx',
          undefined
        ],
        [
          'an inner finally that returns, with an outer finally that completes',
          '',
          'try { try { s.risky(); } finally { return; } } finally { s.safe(); }',
          '',
          undefined
        ],
        [
          'an outer finally that returns, with an inner try that completes',
          '',
          'try { try { s.risky(); } finally { s.safe(); } } finally { return; }',
          '',
          undefined
        ],
        [
          'a catch that rethrows and a finally that returns',
          '',
          'try { s.risky(); } catch (AppEx e) { throw e; } finally { return; }',
          '',
          undefined
        ],
        [
          'a catch of Exception that rethrows and a finally that returns',
          '',
          'try { s.risky(); } catch (Exception e) { throw e; } finally { return; }',
          '',
          undefined
        ],
        [
          'a finally that returns after a try that returns',
          '',
          'try { return; } finally { return; }',
          '',
          undefined
        ],
        [
          "a finally that throws a checked exception different from the try's",
          '',
          'try { throw new AppEx(); } finally { throw new OtherEx(); }',
          '',
          /unreported exception OtherEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with declarations before its return',
          '',
          'try { s.risky(); } finally { int x = 1; x = 2; return; }',
          '',
          undefined
        ],
        [
          'a finally with a loop that cannot end',
          '',
          'try { s.risky(); } finally { while (true) { return; } }',
          '',
          undefined
        ],
        [
          'a finally with a while(true) whose break is in a nested loop',
          '',
          'try { s.risky(); } finally { while (true) { for (int i = 0; i < 2; i++) { break; } } }',
          '',
          undefined
        ],
        [
          'a finally with a while(true) whose break is in a switch',
          '',
          'try { s.risky(); } finally { while (true) { switch (1) { case 1: break; default: break; } } }',
          '',
          undefined
        ],
        [
          'a finally with a do-while(true) without a break',
          '',
          'try { s.risky(); } finally { do { s.safe(); } while (true); }',
          '',
          undefined
        ],
        [
          'a finally with a do-while that returns and can only repeat on a false condition',
          '',
          'try { s.risky(); } finally { do { return; } while (false); }',
          '',
          undefined
        ],
        [
          'a finally with a do-while that returns',
          '',
          'try { s.risky(); } finally { do { return; } while (s != null); }',
          '',
          undefined
        ],
        [
          'a finally with a for(;;) whose break is in a switch',
          '',
          'try { s.risky(); } finally { for (;;) { switch (1) { case 1: break; default: break; } } }',
          '',
          undefined
        ],
        [
          'a finally with a for(;true;)',
          '',
          'try { s.risky(); } finally { for (;true;) { } }',
          '',
          undefined
        ],
        [
          'a finally with a switch whose cases all return',
          '',
          'try { s.risky(); } finally { switch (1) { case 1: return; default: return; } }',
          '',
          undefined
        ],
        [
          'a finally with a switch that falls through to a return',
          '',
          'try { s.risky(); } finally { switch (1) { case 1: s.safe(); default: return; } }',
          '',
          undefined
        ],
        [
          'a finally with if-else whose branches throw',
          '',
          'try { s.risky(); } finally { if (s != null) { throw new RtEx(); } else { throw new RtEx(); } }',
          '',
          undefined
        ],
        [
          'a finally with an if-else-if chain that always returns',
          '',
          'try { s.risky(); } finally { if (s == null) { return; } else if (s != null) { return; } else { return; } }',
          '',
          undefined
        ],
        [
          'a finally that completes normally does not discard the exception of the try',
          '',
          'try { throw new AppEx(); } finally { s.safe(); }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally that completes normally does not discard the exception of a catch',
          '',
          'try { s.safe(); } catch (RtEx e) { throw new AppEx(); } finally { s.safe(); }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'an empty finally does not discard the exception of the try',
          '',
          'try { s.risky(); } finally { }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop that breaks completes normally',
          '',
          'try { s.risky(); } finally { while (true) { break; } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with an if without an else completes normally',
          '',
          'try { s.risky(); } finally { if (s != null) { return; } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with an if-else where only one branch returns completes normally',
          '',
          'try { s.risky(); } finally { if (s != null) { return; } else { s.safe(); } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a try-catch whose catch completes completes normally',
          '',
          'try { s.risky(); } finally { try { return; } catch (RtEx e) { s.safe(); } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a try-catch whose try can complete completes normally',
          '',
          'try { s.risky(); } finally { try { return; } catch (RtEx e) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop that does not run completes normally',
          '',
          'try { s.risky(); } finally { for (int i = 0; i < 2; i++) { return; } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop that breaks out of itself completes normally',
          '',
          'try { s.risky(); } finally { for (int i = 0; i < 2; i++) { break; } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop on a condition completes normally',
          '',
          'try { s.risky(); } finally { while (s != null) { return; } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a while(true) with a conditional break completes normally',
          '',
          'try { s.risky(); } finally { while (true) { if (s != null) { break; } } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a do-while(true) with a break completes normally',
          '',
          'try { s.risky(); } finally { do { break; } while (true); }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a do-while that can continue completes normally',
          '',
          'try { s.risky(); } finally { do { if (s == null) { continue; } return; } while (s != null); }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a counting for loop completes normally',
          '',
          'try { s.risky(); } finally { for (int i = 0; i < 3; i++) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a switch without a default completes normally',
          '',
          'try { s.risky(); } finally { switch (1) { case 1: return; case 2: return; } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a switch that breaks completes normally',
          '',
          'try { s.risky(); } finally { switch (1) { case 1: break; default: return; } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a switch whose last group completes normally',
          '',
          'try { s.risky(); } finally { switch (1) { case 1: return; default: s.safe(); } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a switch that has a label after the last group completes normally',
          '',
          'try { s.risky(); } finally { switch (1) { default: return; case 3: } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with an empty switch completes normally',
          '',
          'try { s.risky(); } finally { switch (1) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with if (true) return; completes normally',
          '',
          'try { s.risky(); } finally { if (true) return; }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with an if-else-if chain without a final else completes normally',
          '',
          'try { s.risky(); } finally { if (s == null) { return; } else if (s != null) { return; } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a try-finally whose finally completes completes normally',
          '',
          'try { s.risky(); } finally { try { return; } finally { s.safe(); } }',
          '',
          undefined
        ],
        [
          'a finally with a try-catch that handles a throw completes normally',
          '',
          'try { s.risky(); } finally { try { throw new RtEx(); } catch (RtEx e) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a break in a loop does not make a finally that ends a loop iteration abrupt for the exception of the try',
          '',
          'for (int i = 0; i < 2; i++) { try { s.risky(); } finally { if (i > 0) { break; } } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop on the condition true',
          '',
          'try { s.risky(); } finally { while (true) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition !false',
          '',
          'try { s.risky(); } finally { while (!false) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition !!true',
          '',
          'try { s.risky(); } finally { while (!!true) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition !(!true)',
          '',
          'try { s.risky(); } finally { while (!(!true)) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition true && true',
          '',
          'try { s.risky(); } finally { while (true && true) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition false || true',
          '',
          'try { s.risky(); } finally { while (false || true) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition true & true',
          '',
          'try { s.risky(); } finally { while (true & true) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition true | false',
          '',
          'try { s.risky(); } finally { while (true | false) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition true ^ false',
          '',
          'try { s.risky(); } finally { while (true ^ false) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition true == true',
          '',
          'try { s.risky(); } finally { while (true == true) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition true != false',
          '',
          'try { s.risky(); } finally { while (true != false) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition ((!false))',
          '',
          'try { s.risky(); } finally { while (((!false))) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1 < 2',
          '',
          'try { s.risky(); } finally { while (1 < 2) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1 <= 1',
          '',
          'try { s.risky(); } finally { while (1 <= 1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 2 > 1',
          '',
          'try { s.risky(); } finally { while (2 > 1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 5 == 5',
          '',
          'try { s.risky(); } finally { while (5 == 5) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition -1 < 0',
          '',
          'try { s.risky(); } finally { while (-1 < 0) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition ~0 == -1',
          '',
          'try { s.risky(); } finally { while (~0 == -1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition ~1 == -2',
          '',
          'try { s.risky(); } finally { while (~1 == -2) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1 + 1 == 2',
          '',
          'try { s.risky(); } finally { while (1 + 1 == 2) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 2 * 3 == 6',
          '',
          'try { s.risky(); } finally { while (2 * 3 == 6) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 10 / 3 == 3',
          '',
          'try { s.risky(); } finally { while (10 / 3 == 3) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 10 % 3 == 1',
          '',
          'try { s.risky(); } finally { while (10 % 3 == 1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition -10 / 3 == -3',
          '',
          'try { s.risky(); } finally { while (-10 / 3 == -3) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition -10 % 3 == -1',
          '',
          'try { s.risky(); } finally { while (-10 % 3 == -1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1 / 0 == 0',
          '',
          'try { s.risky(); } finally { while (1 / 0 == 0) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop on the condition 1 % 0 == 0',
          '',
          'try { s.risky(); } finally { while (1 % 0 == 0) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop on the condition 1.0 / 0 > 1',
          '',
          'try { s.risky(); } finally { while (1.0 / 0 > 1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 2147483647 + 1 < 0',
          '',
          'try { s.risky(); } finally { while (2147483647 + 1 < 0) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 2147483647 + 1L > 0',
          '',
          'try { s.risky(); } finally { while (2147483647 + 1L > 0) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 2147483647 * 2 < 0',
          '',
          'try { s.risky(); } finally { while (2147483647 * 2 < 0) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition -2147483648 - 1 > 0',
          '',
          'try { s.risky(); } finally { while (-2147483648 - 1 > 0) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 9223372036854775807L + 1 < 0',
          '',
          'try { s.risky(); } finally { while (9223372036854775807L + 1 < 0) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1L << 63 < 0',
          '',
          'try { s.risky(); } finally { while (1L << 63 < 0) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1 << 31 < 0',
          '',
          'try { s.risky(); } finally { while (1 << 31 < 0) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1 << 32 == 1',
          '',
          'try { s.risky(); } finally { while (1 << 32 == 1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1 << 33 == 2',
          '',
          'try { s.risky(); } finally { while (1 << 33 == 2) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1L << 64 == 1',
          '',
          'try { s.risky(); } finally { while (1L << 64 == 1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition -8 >> 1 == -4',
          '',
          'try { s.risky(); } finally { while (-8 >> 1 == -4) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition -8 >>> 28 == 15',
          '',
          'try { s.risky(); } finally { while (-8 >>> 28 == 15) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition -8L >>> 60 == 15',
          '',
          'try { s.risky(); } finally { while (-8L >>> 60 == 15) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (5 & 4) == 4',
          '',
          'try { s.risky(); } finally { while ((5 & 4) == 4) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (5 | 2) == 7',
          '',
          'try { s.risky(); } finally { while ((5 | 2) == 7) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (5 ^ 1) == 4',
          '',
          'try { s.risky(); } finally { while ((5 ^ 1) == 4) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 0x10 == 16',
          '',
          'try { s.risky(); } finally { while (0x10 == 16) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 010 == 8',
          '',
          'try { s.risky(); } finally { while (010 == 8) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 0b101 == 5',
          '',
          'try { s.risky(); } finally { while (0b101 == 5) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1_000 == 1000',
          '',
          'try { s.risky(); } finally { while (1_000 == 1000) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 0xFFFFFFFF == -1',
          '',
          'try { s.risky(); } finally { while (0xFFFFFFFF == -1) { } }',
          '',
          undefined
        ],
        [
          "a finally with a loop on the condition 'a' < 'b'",
          '',
          "try { s.risky(); } finally { while ('a' < 'b') { } }",
          '',
          undefined
        ],
        [
          "a finally with a loop on the condition 'a' == 97",
          '',
          "try { s.risky(); } finally { while ('a' == 97) { } }",
          '',
          undefined
        ],
        [
          "a finally with a loop on the condition 'a' + 1 == 98",
          '',
          "try { s.risky(); } finally { while ('a' + 1 == 98) { } }",
          '',
          undefined
        ],
        [
          "a finally with a loop on the condition (char) 65 == 'A'",
          '',
          "try { s.risky(); } finally { while ((char) 65 == 'A') { } }",
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (byte) 200 == -56',
          '',
          'try { s.risky(); } finally { while ((byte) 200 == -56) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (byte) 128 == -128',
          '',
          'try { s.risky(); } finally { while ((byte) 128 == -128) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (short) 70000 == 4464',
          '',
          'try { s.risky(); } finally { while ((short) 70000 == 4464) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (int) 3.9 == 3',
          '',
          'try { s.risky(); } finally { while ((int) 3.9 == 3) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (int) -3.9 == -3',
          '',
          'try { s.risky(); } finally { while ((int) -3.9 == -3) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (long) 1e19 == 9223372036854775807L',
          '',
          'try { s.risky(); } finally { while ((long) 1e19 == 9223372036854775807L) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (int) (0.0 / 0) == 0',
          '',
          'try { s.risky(); } finally { while ((int) (0.0 / 0) == 0) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (char) -1 == 65535',
          '',
          'try { s.risky(); } finally { while ((char) -1 == 65535) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (int) 1e10 == 2147483647',
          '',
          'try { s.risky(); } finally { while ((int) 1e10 == 2147483647) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1.5 < 2',
          '',
          'try { s.risky(); } finally { while (1.5 < 2) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 0.5 + 0.25 == 0.75',
          '',
          'try { s.risky(); } finally { while (0.5 + 0.25 == 0.75) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1.0f == 1.0',
          '',
          'try { s.risky(); } finally { while (1.0f == 1.0) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 0.1f + 0.2f == 0.3f',
          '',
          'try { s.risky(); } finally { while (0.1f + 0.2f == 0.3f) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (float) 0.1 == 0.1f',
          '',
          'try { s.risky(); } finally { while ((float) 0.1 == 0.1f) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1e3 == 1000',
          '',
          'try { s.risky(); } finally { while (1e3 == 1000) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1 == 1.0',
          '',
          'try { s.risky(); } finally { while (1 == 1.0) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 3 / 2 == 1',
          '',
          'try { s.risky(); } finally { while (3 / 2 == 1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 3 / 2.0 == 1.5',
          '',
          'try { s.risky(); } finally { while (3 / 2.0 == 1.5) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 5.5 % 2 == 1.5',
          '',
          'try { s.risky(); } finally { while (5.5 % 2 == 1.5) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1L < 2',
          '',
          'try { s.risky(); } finally { while (1L < 2) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1L == 1',
          '',
          'try { s.risky(); } finally { while (1L == 1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 5000000000L > 1',
          '',
          'try { s.risky(); } finally { while (5000000000L > 1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition true ? true : false',
          '',
          'try { s.risky(); } finally { while (true ? true : false) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition false ? false : true',
          '',
          'try { s.risky(); } finally { while (false ? false : true) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (1 < 2 ? 3 : 4) == 3',
          '',
          'try { s.risky(); } finally { while ((1 < 2 ? 3 : 4) == 3) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (1 > 2 ? 3 : 4) == 4',
          '',
          'try { s.risky(); } finally { while ((1 > 2 ? 3 : 4) == 4) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (true ? 1 : 2.0) == 1.0',
          '',
          'try { s.risky(); } finally { while ((true ? 1 : 2.0) == 1.0) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition "a" == "a"',
          '',
          'try { s.risky(); } finally { while ("a" == "a") { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition "a" + "b" == "ab"',
          '',
          'try { s.risky(); } finally { while ("a" + "b" == "ab") { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition true && 1 < 2',
          '',
          'try { s.risky(); } finally { while (true && 1 < 2) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1 < 2 && 2 < 3',
          '',
          'try { s.risky(); } finally { while (1 < 2 && 2 < 3) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition 1 < 2 || 1 / 0 == 0',
          '',
          'try { s.risky(); } finally { while (1 < 2 || 1 / 0 == 0) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop on the condition 1 > 2 && 1 / 0 == 0',
          '',
          'try { s.risky(); } finally { while (1 > 2 && 1 / 0 == 0) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop on the condition !(1 > 2)',
          '',
          'try { s.risky(); } finally { while (!(1 > 2)) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition !(1 < 2) || !(2 < 1)',
          '',
          'try { s.risky(); } finally { while (!(1 < 2) || !(2 < 1)) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (int) 1L == 1',
          '',
          'try { s.risky(); } finally { while ((int) 1L == 1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (double) 1 == 1.0',
          '',
          'try { s.risky(); } finally { while ((double) 1 == 1.0) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition (boolean) true',
          '',
          'try { s.risky(); } finally { while ((boolean) true) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition +1 == 1',
          '',
          'try { s.risky(); } finally { while (+1 == 1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition -(-1) == 1',
          '',
          'try { s.risky(); } finally { while (-(-1) == 1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition - -1 == 1',
          '',
          'try { s.risky(); } finally { while (- -1 == 1) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition -(1 + 1) == -2',
          '',
          'try { s.risky(); } finally { while (-(1 + 1) == -2) { } }',
          '',
          undefined
        ],
        [
          'a finally with a loop on the condition b',
          '',
          'try { s.risky(); } finally { while (b) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop on the condition !b',
          '',
          'try { s.risky(); } finally { while (!b) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop on the condition b || true',
          '',
          'try { s.risky(); } finally { while (b || true) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop on the condition true || b',
          '',
          'try { s.risky(); } finally { while (true || b) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop on the condition b && false',
          '',
          'try { s.risky(); } finally { while (b && false) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop on the condition s == null',
          '',
          'try { s.risky(); } finally { while (s == null) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop on the condition true && b',
          '',
          'try { s.risky(); } finally { while (true && b) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a loop on the condition (b ? 1 : 2) == 1',
          '',
          'try { s.risky(); } finally { while ((b ? 1 : 2) == 1) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a do-while loop on the condition true',
          '',
          'try { s.risky(); } finally { do { } while (true); }',
          '',
          undefined
        ],
        [
          'a finally with a for loop on the condition true',
          '',
          'try { s.risky(); } finally { for (;true;) { } }',
          '',
          undefined
        ],
        [
          'a finally with a do-while loop on the condition !false',
          '',
          'try { s.risky(); } finally { do { } while (!false); }',
          '',
          undefined
        ],
        [
          'a finally with a for loop on the condition !false',
          '',
          'try { s.risky(); } finally { for (;!false;) { } }',
          '',
          undefined
        ],
        [
          'a finally with a do-while loop on the condition 1 < 2',
          '',
          'try { s.risky(); } finally { do { } while (1 < 2); }',
          '',
          undefined
        ],
        [
          'a finally with a for loop on the condition 1 < 2',
          '',
          'try { s.risky(); } finally { for (;1 < 2;) { } }',
          '',
          undefined
        ],
        [
          'a finally with a do-while loop on the condition false',
          '',
          'try { s.risky(); } finally { do { } while (false); }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a do-while loop on the condition 1 > 2',
          '',
          'try { s.risky(); } finally { do { } while (1 > 2); }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a do-while loop on the condition b',
          '',
          'try { s.risky(); } finally { do { } while (b); }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ],
        [
          'a finally with a for loop on the condition b',
          '',
          'try { s.risky(); } finally { for (;b;) { } }',
          '',
          /unreported exception AppEx; must be caught or declared to be thrown/
        ]
      ]
      for (const [comment, extra, body, throwsClause, error] of cases) {
        if (error === undefined) {
          it(`accepts ${comment}`, () =>
            expect(() => compileClasses(extra, body, throwsClause)).not.toThrow())
        } else {
          it(`rejects ${comment}`, () =>
            expect(() => compileClasses(extra, body, throwsClause)).toThrow(error))
        }
      }
    })
    describe('throws clause in the class file', () => {
      // Compiles the program, writes its classes out and reads them back with the class file
      // reader, giving the exceptions of each public or protected method by class and method
      const readThrows = (source: string) => {
        const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
          allowedStartRules: ['CompilationUnit']
        })
        const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'throws-'))
        try {
          const writer = new BinaryWriter()
          for (const compiled of compile(parser.parse(source) as AST)) {
            writer.writeBinary(compiled.classFile, directory + path.sep)
          }
          const result: { [name: string]: string[] | undefined } = {}
          for (const file of fs.readdirSync(directory).filter(f => f.endsWith('.class'))) {
            const meta = extractClassMetaFromBuffer(fs.readFileSync(path.join(directory, file)))
            for (const method of meta.methods) {
              result[`${meta.name}.${method.name}${method.descriptor}`] = method.exceptions
            }
          }
          return result
        } finally {
          fs.rmSync(directory, { recursive: true, force: true })
        }
      }

      const thrown = readThrows(`
        class AppEx extends Exception { }
        class OtherEx extends Exception { }
        abstract class Base {
          public abstract void load(int n) throws AppEx, OtherEx;
          public abstract void plain();
        }
        class Impl extends Base {
          public Impl() throws AppEx { }
          public void load(int n) throws AppEx { if (n > 0) { throw new AppEx(); } }
          public void plain() { }
          public static void make(int n) throws OtherEx, AppEx { }
          public int value() throws RuntimeException { return 1; }
        }
        public class Main {
          public static void main(String[] args) throws Exception { }
        }
      `)

      it('writes the exceptions of a method', () =>
        expect(thrown['Impl.load(I)V']).toEqual(['AppEx']))
      it('writes several exceptions in the order they are declared', () =>
        expect(thrown['Impl.make(I)V']).toEqual(['OtherEx', 'AppEx']))
      it('writes the exceptions of an abstract method', () =>
        expect(thrown['Base.load(I)V']).toEqual(['AppEx', 'OtherEx']))
      it('writes the exceptions of a constructor', () =>
        expect(thrown['Impl.<init>()V']).toEqual(['AppEx']))
      it('writes the exceptions of main', () =>
        expect(thrown['Main.main([Ljava/lang/String;)V']).toEqual(['java/lang/Exception']))
      it('writes unchecked exceptions that are declared', () =>
        expect(thrown['Impl.value()I']).toEqual(['java/lang/RuntimeException']))
      it('writes no attribute for a method without a throws clause', () => {
        expect(thrown['Impl.plain()V']).toBeUndefined()
        expect(thrown['Base.plain()V']).toBeUndefined()
      })
    })
    describe('every way to end a try, a catch and a finally', () => {
      // How the try block, the catch block and the finally block each end. Each combination is a
      // loop whose body is a try statement (single) or a try-catch inside a try-finally (nested),
      // and the expected output of every program was printed by a JDK 8 JVM.
      const bodies = (increment: number, last: string) => [
        ['1', `count = count + ${increment};`],
        ['T', `count = count + ${increment}; throw new ${increment === 1 ? 'First' : 'Second'}();`],
        ['C', `count = count + ${increment}; continue;`],
        ['B', `count = count + ${increment}; break;`],
        ['R', `count = count + ${increment}; return ${last};`]
      ]
      const expected: { [program: string]: string[] } = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'finally-combinations.expected.json'), 'utf-8')
      )

      for (const shape of ['single', 'nested']) {
        for (const [tryEnd, tryBody] of bodies(1, 'count')) {
          it(`${shape} try statements that end the try block with ${tryEnd}`, () => {
            const names: string[] = []
            const methods: string[] = []
            for (const [catchEnd, catchBody] of bodies(10, 'count')) {
              for (const [finallyEnd, finallyBody] of bodies(100, '0 - count')) {
                const name = `m_${tryEnd}${catchEnd}${finallyEnd}`
                const body =
                  shape === 'single'
                    ? `try { ${tryBody} } catch (First e) { ${catchBody} } finally { ${finallyBody} }`
                    : `try { try { ${tryBody} } catch (First e) { ${catchBody} } } finally { ${finallyBody} }`
                methods.push(
                  `static int ${name}() { count = 0; for (int i = 0; i < 3; i++) { ${body} } return count; }`
                )
                names.push(name)
              }
            }
            const program = `
              class First extends RuntimeException { }
              class Second extends RuntimeException { }
              public class Main {
                static int count;
                ${methods.join('\n')}
                static int dispatch(int which) {
                  switch (which) {
                    ${names.map((name, i) => `case ${i}: return ${name}();`).join('\n')}
                    default: return -1;
                  }
                }
                static void run(String name, int which) {
                  String outcome;
                  try {
                    outcome = "returned " + dispatch(which);
                  } catch (First e) {
                    outcome = "First";
                  } catch (Second e) {
                    outcome = "Second";
                  }
                  System.out.println(name + " " + outcome + " count=" + count);
                }
                public static void main(String[] args) {
                  ${names.map((name, i) => `run("${name}", ${i});`).join('\n')}
                }
              }
            `
            runTest(program, expected[`${shape}_${tryEnd}`])
          })
        }
      }
    })
  })
