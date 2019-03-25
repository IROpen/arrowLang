.PHONY : all clean

objects = main.js farsi.js ds/main.js ds/farsi.js react/main.js react/farsi.js

all : $(objects)

main.js : main.far env.js
	arrowlang --env-path "./env" main

farsi.js : farsi.far main.js env.js
	arrowlang --env-path "./env" farsi

ds/main.js : main.js ds/main.far
	arrowlang --env-path "../env" ds/main

ds/farsi.js : ds/main.js ds/farsi.far
	arrowlang --env-path "../env" ds/farsi

react/main.js : react/main.far
	arrowlang --env-path "../env" react/main

react/farsi.js : react/farsi.far
	arrowlang --env-path "../env" react/farsi

clean :
	rm $(objects)