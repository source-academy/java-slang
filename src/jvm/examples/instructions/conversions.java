package tests;

public class conversions {
    public static void main(String[] args) {

        byte b1 = (byte) 255;
        char c1 = (char) 0x12345678;
        int i1 = (int) 2147483648L;
        float f1 = (float) 9223372036854775807L;
        double d1 = (double) 9223372036854775807L;
        int i2 = (int) 9223372036854775806f;
        int i3 = (int) -9223372036854775806f;
        int i4 = (int) Float.NaN;
        int i5 = (int) Float.POSITIVE_INFINITY;
        int i6 = (int) Float.NEGATIVE_INFINITY;
        int i7 = (int) Double.NaN;
        int i8 = (int) Double.POSITIVE_INFINITY;
        int i9 = (int) Double.NEGATIVE_INFINITY;
        long l1 = (long) Float.POSITIVE_INFINITY;
        long l2 = (long) Float.NEGATIVE_INFINITY;
        long l3 = (long) Double.POSITIVE_INFINITY;
        long l4 = (long) Double.NEGATIVE_INFINITY;
        long l5 = (long) Float.NaN;
        long l6 = (long) Double.NaN;

        if (b1 != -1) throw new RuntimeException("b1");
        if (c1 != 0x5678) throw new RuntimeException("c1");
        if (i1 != -2147483648) throw new RuntimeException("i1");
        if (f1 != 9.223372E18f) throw new RuntimeException("f1");
        if (d1 != 9.223372036854776E18) throw new RuntimeException("d1");
        if (i2 != 2147483647) throw new RuntimeException("i2");
        if (i3 != -2147483647) throw new RuntimeException("i3");
        if (i4 != 0) throw new RuntimeException("i4");
        if (i5 != 2147483647) throw new RuntimeException("i5");
        if (i6 != -2147483648) throw new RuntimeException("i6");
        if (i7 != 0) throw new RuntimeException("i7");
        if (i8 != 2147483647) throw new RuntimeException("i8");
        if (i9 != -2147483648) throw new RuntimeException("i9");
        if (l1 != 9223372036854775807L) throw new RuntimeException("l1");
        if (l2 != -9223372036854775808L) throw new RuntimeException("l2");
        if (l3 != 9223372036854775807L) throw new RuntimeException("l3");
        if (l4 != -9223372036854775808L) throw new RuntimeException("l4");
        if (l5 != 0) throw new RuntimeException("l5");
        if (l6 != 0) throw new RuntimeException("l6");

        System.out.println("conversions OK");
    }
}
