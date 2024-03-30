import java.util.function.Function;

import modules.rune.Rune;

public class Main {
    public static void main(String[] args) {
        Rune.show(Rune.circle);
        Rune.show(Rune.blank);
        Rune.show(Rune.corner);
        Rune.show(Rune.heart);
        Rune.show(Rune.nova);
        Rune.show(Rune.pentagram);
        Rune.show(Rune.rcross);
        Rune.show(Rune.ribbon);
        Rune.show(Rune.sail);
        Rune.show(Rune.square);

        Rune.anaglyph(Rune.circle);
        Rune.show(Rune.beside(Rune.circle, Rune.heart));
        Rune.show(Rune.beside_frac(0.3, Rune.circle, Rune.heart));
        Rune.show(Rune.black(Rune.circle));
        Rune.show(Rune.blue(Rune.circle));
        Rune.show(Rune.brown(Rune.circle));
        Rune.show(Rune.color(Rune.circle, 0.8, 0.5, 0.3));
        Rune.show(Rune.flip_horiz(Rune.sail));
        Rune.show(Rune.flip_vert(Rune.sail));
        Rune.show(Rune.green(Rune.circle));
        Rune.hollusion(Rune.circle);
        Rune.show(Rune.indigo(Rune.circle));
        Rune.show(Rune.make_cross(Rune.sail));
        Rune.show(Rune.orange(Rune.circle));
        Rune.show(Rune.overlay(Rune.circle, Rune.heart));
        Rune.show(Rune.overlay_frac(0.3, Rune.circle, Rune.heart));
        Rune.show(Rune.pink(Rune.circle));
        Rune.show(Rune.purple(Rune.circle));
        Rune.show(Rune.quarter_turn_left(Rune.sail));
        Rune.show(Rune.quarter_turn_right(Rune.sail));
        Rune.show(Rune.random_color(Rune.circle));
        Rune.show(Rune.red(Rune.circle));
        Rune.show(Rune.rotate(0.2, Rune.heart));
        Rune.show(Rune.scale(0.5, Rune.heart));
        Rune.show(Rune.scale_independent(0.5, 0.3, Rune.heart));
        Rune.show(Rune.heart);
        Rune.show(Rune.stack(Rune.heart, Rune.sail));
        Rune.show(Rune.stack_frac(0.3, Rune.heart, Rune.sail));
        Rune.show(Rune.stackn(3, Rune.heart));
        Rune.show(Rune.translate(0.3, 0.5, Rune.heart));
        Rune.show(Rune.turn_upside_down(Rune.heart));
        Rune.show(Rune.white(Rune.heart));
        Rune.show(Rune.yellow(Rune.heart));

        Function<Rune, Rune> f = (r) -> Rune.beside(r, Rune.heart);
        Rune.show(Rune.repeat_pattern(5, f, Rune.heart));

    }
}
