.PHONY : all clean

objects = main.js farsi.js ds/main.js ds/farsi.js

all : $(objects)

main.js : main.far env.js
	arrowlang --env-path "./env" main

farsi.js : farsi.far main.js env.js
	arrowlang --env-path "./env" farsi

ds/main.js : main.js ds/main.far
	arrowlang --env-path "../env" ds/main

ds/farsi.js : ds/main.js ds/farsi.far
	arrowlang --env-path "../env" ds/farsi

clean :
	rm $(objects)