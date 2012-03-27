# JSProfiler

A JavaScript memory profiler for Google Chrome.

![Screenshot](https://raw.github.com/cthackers/JSProfiler/master/screenshot.png)

## What is it good for?

Tracks what methods are called and how much memory they take.

## How to use ?

First you need to start google chrome with the following flags:
	
``--enable-memory-info --js-flags="--expose-gc"``

The first flag ``--enable-memory-info`` is required so that the heap info is available in code and the second flag is only required if you want to have access to and call the garbage colector when you want (by clicking the trash can icon)

Add the following to the page header

```html
	<script type="text/javascript" src="jsprofiler.js"></script>
```

### Quick code profile
Somewhere in your code:

```javascript

	JSProfile.start(window, false);

	function myfunction() {
	    // some stuff happening here
	}
	
	function someotherfunction() {
		for (var i = 0; i < 10; i++)
			myfunction();
	    // some stuff happening here
	}
	
	JSProfile.end(window); // will output:
	/*
		myfunction() C = 10, ΔT = 460.83ms, ΔM = 12.13 MB
		someotherfunction() C = 1, T = 4905ms, M = 1.22 KB
	*/
	
```

### Realtime statistics
Somewhere at the begining of your script

```javascript

	JSProfile.start(window, true); // true as second parameter will add the html graph window in your page and update it every 500ms
	// your code
```