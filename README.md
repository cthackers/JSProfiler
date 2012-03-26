# JSProfiler

A JavaScript memory profiler for Google Chrome.

## What is it good for?
	

## How to use ?

```javascript

	JSProfile.start(window, false); // window is the context to track, false means no realtime tracking should happen
	
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

## 