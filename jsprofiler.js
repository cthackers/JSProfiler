var JSProfile = (function() {
    var profiles = {},
        running = false,
        references,
        sort = 'n',
        method = 1,
        timeout = undefined,
        mem = [],
    html = '<h1>Profile<span id="gc" title="Call Garbage Collector"></span></h1><div id="profileBody"><table cellspacing="1" cellpadding="0" border="0" width="100%"> \
		<thead><tr><th class="n">Method<span id="poiner" class="up"></span></th><th class="c" width="50">#</th><th class="t" width="60">(&Delta;) T</th><th class="m" width="60">(&Delta;) M</th></tr></thead> \
		<tbody id="profileBodyTable"></tbody></table></div><div id="profileGraphs"><div id="memory"><canvas width="195" height="40" id="memgraph" /></div><div id="memorydetails"><table cellspacing="0" cellpadding="0"> \
		<tr><td width="30">Max:</td><td id="mmmax">0 B</td></tr><tr><td>Total:</td><td id="mmtot">0 B</td></tr><tr><td>Used:</td><td id="mmusd">0 B</td></tr></table></div></div>',
    css = '#profileStats {background:#FFF;border:1px solid rgba(0, 0, 0, 0.5);position:absolute;zindex: 1000;width: 300px;height:302px;box-shadow: 0px 1px 2px 2px rgba(170, 187, 204, 0.3);-webkit-user-select: none;position:fixed; right:10px; bottom:10px;}#profileStats h1 \
		{margin:0; padding:3px 10px;font-family:Verdana !important;font-size:10px !important;height:13px;cursor:default;background: #efefef;}#profileStats #gc {background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg\
		AAAAwAAAAMCAMAAABhq6zVAAAABGdBTUEAANbY1E9YMgAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAASUExURWhoaOvr67m5ucbGxqenp39/f1I0BRoAAAAGdFJOU///////ALO/pL8AAAA7SURBVHjahI3BDgAgCEIJ8/\
		9/OUXWoUvPTcYURRYopG5WXNrEQLyTxBITBIPsLZm9ur6Gwp99OPMIMABxgwFzvcnIqgAAAABJRU5ErkJggg==") no-repeat scroll 0 0 transparent;width: 12px;height: 12px;cursor:pointer;float:right;display:none;}\
		#profileStats #profileBody {height: 227px;overflow-y:scroll;padding:2px;font-size:9px !important;font-family: Arial;}#profileStats #profileBody tr td {font-size:9px !important;}#profileStats #profileBody tr th span.up {background: url("data:image/gif;base64,R0lGODlhBgADAIAAAAAAA\
		AAAACH5BAHoAwEALAAAAAAGAAMAAAIGTAB2mMwFADs=") no-repeat scroll 0 0 transparent;width:6px;height:5px;margin-left:3px;display:inline-block;}#profileStats #profileBody tr th span.down {background: \
		url("data:image/gif;base64,R0lGODlhBgADAIAAAAAAAAAAACH5BAHoAwEALAAAAAAGAAMAAAIGhB8HwcYFADs=") no-repeat scroll 0 0 transparent;width:6px;height:5px;margin-left:3px;display:inline-block;}#profileStats \
		#profileBody tr th {background: #efefef;padding:2px 0;-webkit-user-select: none;cursor:pointer;font-size:10px !important;}#profileStats #profileBody tr td:first-child {text-align:left}#profileStats #profileBody tbody tr td {bor\
		der-bottom:1px solid #ccc;max-width:60px;cursor:default;overflow: hidden;text-overflow: ellipsis;}#profileStats #profileBody tr td {text-align:center}#profileStats #profileGraphs {background:#efefef;heig\
		ht:40px;padding:5px;}#profileStats #profileGraphs #memory {background:white;border:1px inset;display:inline-block;width:195px;height:40px;}#profileStats #profileGraphs #memorydetails {background:white;b\
		order:1px inset;float:right;cursor:default;width:80px;height:38px;padding:3px 0px 0px 5px;font-size:9px !important;font-family: Arial !important;}#profileStats #profileGraphs #memorydetails td { font-size:9px !important }\
		::-webkit-scrollbar {width: 5px;margin-left: 3px;}::-webkit-scrollbar-track {-webkit-box-shadow: inset 0 0 1px #efefef;border: 1px solid rgba(170, 170, 170, 0.8);border-top: none;}\
		::-webkit-scrollbar-thumb {background: #efefef;-webkit-box-shadow: inset 0 0 3px rgba(0,0,0,0.5);}::-webkit-scrollbar-thumb:window-inactive {background: #efefef;}';

    function startProfile(context) {
        var name, fn,
            contextName = context.__proto__.constructor.name;
        profiles[contextName] = {};
        for (name in context) {
            fn = context[name];
            if (typeof fn === 'function') {
                context[name] = (function(name, fn) {
                    var args = arguments;
                    return function() {
                        addStats(contextName, true, name);
                        var res = fn.apply(context, arguments);
                        addStats(contextName, false, name);
                        return res;
                    }
                })(name, fn);
            }
        }
    }

    function stopProfile(context) {
        var ctx = profiles[context.__proto__.constructor.name];
        for (var name in ctx) {
            var obj = ctx[name];
            if (obj.count == 1) {
                console.log(name + "() C = 1, T = " + roundNumber(obj.time, 2) + "ms, M = " + bytesToSize(obj.memory, 2));
            } else {
                console.log(name + "() C = " + obj.count + ", " + String.fromCharCode(0x0394) + "T = " + roundNumber(obj.time / obj.count, 2) + "ms, " + String.fromCharCode(0x0394) + "M = " + bytesToSize(obj.memory / obj.count, 2))
            }
        }
        delete(profiles[context.__proto__.constructor.name]);
    }

    function addStats(contextName, start, name) {
        var obj = profiles[contextName][name] || (profiles[contextName][name] = {count:0, time:0, memory:0, ts:0, tm:0});
        if (start) {
            obj.count += 1;
            obj.ts = +new Date();
            obj.tm = console.memory.usedJSHeapSize;
        } else {
            obj.time += (+new Date() - obj.ts);
            var mem = console.memory.usedJSHeapSize - obj.tm;
            if (mem > 0) {
                obj.memory += mem;
            }
        }
    }

    function bytesToSize(bytes, precision) {
        var kilobyte = 1024, megabyte = kilobyte * 1024, gigabyte = megabyte * 1024, terabyte = gigabyte * 1024;
        precision = precision || 2;
        if ((bytes >= 0) && (bytes < kilobyte)) {
            return Math.round(bytes) + ' B';
        } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
            return (bytes / kilobyte).toFixed(precision) + ' KB';
        } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
            return (bytes / megabyte).toFixed(precision) + ' MB';
        } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
            return (bytes / gigabyte).toFixed(precision) + ' GB';
        } else if (bytes >= terabyte) {
            return (bytes / terabyte).toFixed(precision) + ' TB';
        } else {
            return Math.round(bytes) + ' B';
        }
    }

    function roundNumber(num, dec) {
        return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
    }

    function getOrCreateGraph() {
        if (references) return references;

        if (document.body == null) return null;

        var main = document.createElement('div');
        main.id = 'profileStats';
        main.innerHTML = html;
        document.body.appendChild(main);
        var maincss = document.createElement('style');
        maincss.innerHTML = css;
        document.head.appendChild(maincss);
        references = {
            canvas : document.getElementById('memgraph'),
            resolution : document.getElementById('memgraph').width,
            max : document.getElementById("mmmax"),
            tot : document.getElementById("mmtot"),
            usd : document.getElementById("mmusd"),
            body : document.getElementById("profileBodyTable"),
            pointer : document.getElementById("poiner")
        };

        var headers = document.getElementById("profileBody").getElementsByTagName('th');
        for (var i = 0; i < headers.length; i++) {
            headers[i].onclick = function(e) {
                if (sort == e.target.className) {
                    method *= -1;
                } else {
                    method = 1;
                    var pointer = references.pointer;
                    references.pointer.parentNode.removeChild(pointer);
                    e.target.appendChild(pointer);
                }
                references.pointer.className = method < 0 ? "down" : "up";
                sort = e.target.className;
            }
        }
        if (typeof gc == "function") {
            document.getElementById("gc").style.display = "block";
            document.getElementById("gc").onclick = function() {
                gc();
            }
        }
        return references;
    }

    function showStats() {
        var graph = getOrCreateGraph();
        if (!graph) {
            clearTimeout(timeout);
            running && (timeout = setTimeout(showStats, 500));
            return;
        }

        mem.push(console.memory.usedJSHeapSize);
        mem.length > graph.resolution && mem.shift();

        var ctx = graph.canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, graph.resolution, 40);
        ctx.fillStyle = '#7292CF';
        ctx.beginPath();
        ctx.moveTo(0, 40);
        ctx.lineTo(0, 40 - (mem[0] * 40 ) / console.memory.totalJSHeapSize);
        for (var i = 0; i < mem.length; i++) {
            ctx.lineTo(((i + 1) * graph.resolution) / mem.length, 40 - (mem[i] * 40 ) / console.memory.totalJSHeapSize);
        }
        ctx.lineTo(graph.resolution, 40);
        ctx.lineTo(0, 40);
        ctx.fill();

        graph.max.innerHTML = bytesToSize(console.memory.jsHeapSizeLimit, 2);
        graph.tot.innerHTML = bytesToSize(console.memory.totalJSHeapSize, 2);
        graph.usd.innerHTML = bytesToSize(console.memory.usedJSHeapSize, 2);
        drawTable();
        clearTimeout(timeout);
        running && (timeout = setTimeout(showStats, 500));
    }

    function sortFunction(a, b) {
        var as = a[sort], bs = b[sort];
        if (sort == "n") { as = as.toLowerCase(); bs = bs.toLowerCase(); }
        return as > bs ? method : as < bs ? method * -1 : 0;
    }

    function drawTable() {
        var tmp = [];
        for (var context in profiles) {
            var ctx = profiles[context];
            for (var name in ctx) {
                var obj = ctx[name];
                tmp.push({n:name, c:obj.count, t: obj.time / obj.count, m:obj.memory / obj.count, f:obj.f});
            }
        }
        tmp = tmp.sort(sortFunction);
        for (var i = 0; i < tmp.length; i++) {
            tmp[i] = '<tr><td title="' + tmp[i].n + '()">' + tmp[i].n + '()</td><td>' + tmp[i].c + '</td><td>' + roundNumber(tmp[i].t, 0) + 'ms</td><td>' + bytesToSize(tmp[i].m, 2) + '</td></tr>';
        }
        references.body.innerHTML = tmp.join("");
    }

    return {
        start : function(context, realtime) {
            realtime = typeof realtime == "undefind" ? false : realtime;
            startProfile(context || window);
            realtime && (running = true) && showStats(context || window);
        },
        stop : function(context) {
            running = false;
            mem = [];
            stopProfile(context || window);
        }
    }
})();