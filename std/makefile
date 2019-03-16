.PHONY : all clean

all : main.js farsi.js ds/main.js

main.js : main.far env.js
	arrowlang --env-path "./env" main

farsi.js : farsi.far main.js env.js
	arrowlang --env-path "./env" farsi

ds/main.js : main.js ds/main.far
	arrowlang --env-path "../env" ds/main

clean :
	rm main.js farsi.js ds/main.js