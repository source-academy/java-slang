public class Math {
    public static void Main(String[] args) {
        int i1 = 2147483647 + 2147483647;
        int i2 = -2147483648 - 2147483647;
        int i3 = -2147483648 + -1;
        int i4 = 2147483647 - -1;

        long l1 = 9223372036854775807L + 9223372036854775807L;
        long l2 = -9223372036854775808L - 9223372036854775807L;
        long l3 = -9223372036854775808L + -1L;
        long l4 = 9223372036854775807L - -1L;

        float f1 = 3.4e38f + 3.4e38f;
        float f2 = -3.4e38f - 3.4e38f;
        float f3 = -3.4e38f + -1.0f;
        float f4 = 3.4e38f - -1.0f;
        float f5 = Float.POSITIVE_INFINITY + Float.POSITIVE_INFINITY;
        float f6 = Float.NEGATIVE_INFINITY - Float.POSITIVE_INFINITY;
        float f7 = Float.NaN + 1;
        float f8 = Float.NaN - 1;
        float f9 = -0f + 0f;
        float f10 = -0f + -0f;
        float f11 = 0f % 0f;
        float f12 = Float.POSITIVE_INFINITY % 1;
        float f13 = -0f % Float.POSITIVE_INFINITY;

        double d1 = 1.7e308 + 1.7e308;
        double d2 = -1.7e308 - 1.7e308;
        double d3 = -1.7e308 + -1.0d;
        double d4 = 1.7e308 - -1.0d;
        double d5 = Double.POSITIVE_INFINITY + Double.POSITIVE_INFINITY;
        double d6 = Double.NEGATIVE_INFINITY - Double.POSITIVE_INFINITY;
        double d7 = Double.NaN + 1d;
        double d8 = Double.NaN - 1d;
        double d9 = -0d + 0d;
        double d10 = -0d + -0d;
        double d11 = 0d % 0d;
        double d12 = Double.POSITIVE_INFINITY % 1;
        double d13 = -0d % Double.POSITIVE_INFINITY;

        if (i1 != -2) throw new RuntimeException("i1");
        if (i2 != 1) throw new RuntimeException("i2");
        if (i3 != 2147483647) throw new RuntimeException("i3");
        if (i4 != 2147483646) throw new RuntimeException("i4");

        if (l1 != -2L) throw new RuntimeException("l1");
        if (l2 != 1L) throw new RuntimeException("l2");
        if (l3 != 9223372036854775807L) throw new RuntimeException("l3");
        if (l4 != 9223372036854775806L) throw new RuntimeException("l4");

        if (f1 != Float.POSITIVE_INFINITY) throw new RuntimeException("f1");
        if (f2 != Float.NEGATIVE_INFINITY) throw new RuntimeException("f2");
        if (f3 != Float.NEGATIVE_INFINITY) throw new RuntimeException("f3");
        if (f4 != Float.POSITIVE_INFINITY) throw new RuntimeException("f4");
        if (f5 != Float.POSITIVE_INFINITY) throw new RuntimeException("f5");
        if (f6 != Float.NEGATIVE_INFINITY) throw new RuntimeException("f6");
        if (!Float.isNaN(f7)) throw new RuntimeException("f7");
        if (!Float.isNaN(f8)) throw new RuntimeException("f8");
        if (f9 != 0f) throw new RuntimeException("f9");
        if (f10 != 0f) throw new RuntimeException("f10");
        if (!Float.isNaN(f11)) throw new RuntimeException("f11");
        if (!Float.isNaN(f12)) throw new RuntimeException("f12");
        if (!Float.isNaN(f13)) throw new RuntimeException("f13");
        
        if (d1 != Double.POSITIVE_INFINITY) throw new RuntimeException("d1");
        if (d2 != Double.NEGATIVE_INFINITY) throw new RuntimeException("d2");
        if (d3 != Double.NEGATIVE_INFINITY) throw new RuntimeException("d3");
        if (d4 != Double.POSITIVE_INFINITY) throw new RuntimeException("d4");
        if (d5 != Double.POSITIVE_INFINITY) throw new RuntimeException("d5");
        if (d6 != Double.NEGATIVE_INFINITY) throw new RuntimeException("d6");
        if (!Double.isNaN(d7)) throw new RuntimeException("d7");
        if (!Double.isNaN(d8)) throw new RuntimeException("d8");
        if (d9 != 0d) throw new RuntimeException("d9");
        if (d10 != 0d) throw new RuntimeException("d10");
        if (!Double.isNaN(d11)) throw new RuntimeException("d11");
        if (!Double.isNaN(d12)) throw new RuntimeException("d12");
        if (!Double.isNaN(d13)) throw new RuntimeException("d13");

        System.out.println("math OK");
    }
}
