export const rawLibInfo = {
  packages: [
    {
      name: 'java.lang',
      classes: [
        {
          name: 'public final java.lang.String'
        },
        {
          name: 'public final java.lang.Object'
        },
        {
          name: 'public final java.lang.System',
          fields: ['public static final java.io.PrintStream out']
        },
        {
          name: 'public final java.lang.Math',
          methods: [
            'public static int max(int,int)',
            'public static int min(int,int)',
            'public static double log10(double)'
          ]
        }
      ]
    },
    {
      name: 'java.io',
      classes: [
        {
          name: 'public java.io.PrintStream',
          methods: [
            'public void println(java.lang.String)',
            'public void println(int)',
            'public void println(long)',
            'public void println(float)',
            'public void println(double)',
            'public void println(char)',
            'public void println(boolean)',
            'public void print(java.lang.String)',
            'public void print(int)',
            'public void print(long)',
            'public void print(float)',
            'public void print(double)',
            'public void print(char)',
            'public void print(boolean)'
          ]
        }
      ]
    },
    {
      name: 'java.util',
      classes: [
        {
          name: 'public java.util.Arrays',
          methods: ['public static java.lang.String toString(int[])']
        }
      ]
    }
  ]
}
