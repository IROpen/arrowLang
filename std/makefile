.PHONY : all clean

all : main.js farsi.js

main.js : main.far
	arrowlang main

farsi.js : farsi.far main.js
	arrowlang farsi

clean :
	rm main.js farsi.js