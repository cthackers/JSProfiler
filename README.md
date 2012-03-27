# JSProfiler

A JavaScript memory profiler for Google Chrome.

![Screenshot](https://raw.github.com/cthackers/JSProfiler/master/screenshot.png)

## What is it good for?

Tracks what methods are called and how much memory they take.

## How to use ?

Add the following to the page header

```html
	<script type="text/javascript" src="jsprofiler.js"></script>
```

Then somwhere in your code:

```javascript

	JSProfile.start(window, true);
	
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