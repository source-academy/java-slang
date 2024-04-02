class Comparison {
    public static void main(String[] args) {
        long l1 = 0L;
        long l2 = 1L;

        float f1 = 0.0f;
        float f2 = 1.0f;
        float fn = Float.NaN;

        double d1 = 0.0;
        double d2 = 1.0;
        double dn = Double.NaN;

        int i1 = 0;
        int i2 = 1;

        Object o1 = new Object();
        Object o2 = new Object();

        if (l1 == l2 || l2 != l2 || l1 != l1 || l1 > l2 || l2 < l1 || l1 >= l2 || l2 <= l1) {
            throw new RuntimeException("long comparison failed");
        }

        if (f1 == f2 || f2 != f2 || f1 != f1 || f1 == fn || f2 == fn || fn == fn || f1 > f2 || f2 < f1 || f1 >= f2 || f2 <= f1) {
            throw new RuntimeException("float comparison failed");
        }

        if (d1 == d2 || d2 != d2 || d1 != d1 || d1 == dn || d2 == dn || dn == dn || d1 > d2 || d2 < d1 || d1 >= d2 || d2 <= d1) {
            throw new RuntimeException("double comparison failed");
        }

        if (i1 == i2 || i2 != i2 || i1 != i1 || i1 > i2 || i2 < i1 || i1 >= i2 || i2 <= i1) {
            throw new RuntimeException("int comparison failed");
        }

        if (o1 == o2 || o2 != o2 || o1 != o1) {
            throw new RuntimeException("object comparison failed");
        }
    }
}