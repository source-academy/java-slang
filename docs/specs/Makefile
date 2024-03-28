PDFLATEX = latexmk -pdf

SPECSCOMPONENT = JVM
SPECS = $(SPECSCOMPONENT:%=java_%)

PDFSPECS = $(SPECS:%=%.pdf)

HELPERSTEX = $(HELPERS:%=sjava_%.tex)

all: $(PDFSPECS)

%.pdf: %.tex 
	$(PDFLATEX) $*

clean:
	rm -f *~ *.dvi *.aux *.log *.ps *.out *.pdf
