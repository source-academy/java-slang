PDFLATEX = latexmk -pdf

SPECSCOMPONENT = JVM csec

SPECS = $(SPECSCOMPONENT:%=java_%)

PDFSPECS = $(SPECS:%=%.pdf)

HELPERSTEX = $(HELPERS:%=java_%.tex)

all: $(PDFSPECS)

%.pdf: %.tex 
	$(PDFLATEX) $*

clean:
	rm -f *~ *.dvi *.aux *.log *.ps *.out *.pdf *.fls *.fdb_latexmk
