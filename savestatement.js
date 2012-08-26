// Based on work by Aral Balkan - see http://simianstudios.com/blog/post/smile-csv-scraper-for-freeagent-and-xero for details
function initializeFlashEmbed() {

	var IE = document.all,
		 URL = 'http://www.adobe.com/go/getflashplayer',
		 JQUERY = typeof jQuery == 'function', 
		 RE = /(\d+)[^\d]+(\d+)[^\d]*(\d*)/,
		 GLOBAL_OPTS = { 
			// very common opts
			width: '100%',
			height: '100%',		
			id: "_" + ("" + Math.random()).slice(9),

			// flashembed defaults
			allowfullscreen: true,
			allowscriptaccess: 'always',
			quality: 'high',	

			// flashembed specific options
			version: [3, 0],
			onFail: null,
			expressInstall: null, 
			w3c: false,
			cachebusting: false  		 		 
	};

	// version 9 bugfix: (http://blog.deconcept.com/2006/07/28/swfobject-143-released/)
	if (window.attachEvent) {
		window.attachEvent("onbeforeunload", function() {
			__flash_unloadHandler = function() {};
			__flash_savedUnloadHandler = function() {};
		});
	}

	// simple extend
	function extend(to, from) {
		if (from) {
			for (var key in from) {
				if (from.hasOwnProperty(key)) {
					to[key] = from[key];
				}
			}
		} 
		return to;
	}	

	// used by asString method	
	function map(arr, func) {
		var newArr = []; 
		for (var i in arr) {
			if (arr.hasOwnProperty(i)) {
				newArr[i] = func(arr[i]);
			}
		}
		return newArr;
	}

	window.flashembed = function(root, opts, conf) {

		// root must be found / loaded	
		if (typeof root == 'string') {
			root = document.getElementById(root.replace("#", ""));
		}

		// not found
		if (!root) { return; }

		if (typeof opts == 'string') {
			opts = {src: opts};	
		}

		return new Flash(root, extend(extend({}, GLOBAL_OPTS), opts), conf); 
	};	

	// flashembed "static" API
	var f = extend(window.flashembed, {

		conf: GLOBAL_OPTS,

		getVersion: function()  {
			var fo, ver;

			try {
				ver = navigator.plugins["Shockwave Flash"].description.slice(16); 
			} catch(e) {

				try  {
					fo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
					ver = fo && fo.GetVariable("$version");

				} catch(err) {
                try  {
                    fo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
                    ver = fo && fo.GetVariable("$version");  
                } catch(err2) { } 						
				} 
			}

			ver = RE.exec(ver);
			return ver ? [ver[1], ver[3]] : [0, 0];
		},

		asString: function(obj) { 

			if (obj === null || obj === undefined) { return null; }
			var type = typeof obj;
			if (type == 'object' && obj.push) { type = 'array'; }

			switch (type){  

				case 'string':
					obj = obj.replace(new RegExp('(["\\\\])', 'g'), '\\$1');

					// flash does not handle %- characters well. transforms "50%" to "50pct" (a dirty hack, I admit)
					obj = obj.replace(/^\s?(\d+\.?\d+)%/, "$1pct");
					return '"' +obj+ '"';

				case 'array':
					return '['+ map(obj, function(el) {
						return f.asString(el);
					}).join(',') +']'; 

				case 'function':
					return '"function()"';

				case 'object':
					var str = [];
					for (var prop in obj) {
						if (obj.hasOwnProperty(prop)) {
							str.push('"'+prop+'":'+ f.asString(obj[prop]));
						}
					}
					return '{'+str.join(',')+'}';
			}

			// replace ' --> "  and remove spaces
			return String(obj).replace(/\s/g, " ").replace(/\'/g, "\"");
		},

		getHTML: function(opts, conf) {

			opts = extend({}, opts);

			/******* OBJECT tag and it's attributes *******/
			var html = '<object width="' + opts.width + 
				'" height="' + opts.height + 
				'" id="' + opts.id + 
				'" name="' + opts.id + '"';

			if (opts.cachebusting) {
				opts.src += ((opts.src.indexOf("?") != -1 ? "&" : "?") + Math.random());		
			}			

			if (opts.w3c || !IE) {
				html += ' data="' +opts.src+ '" type="application/x-shockwave-flash"';		
			} else {
				html += ' classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"';	
			}

			html += '>'; 

			/******* nested PARAM tags *******/
			if (opts.w3c || IE) {
				html += '<param name="movie" value="' +opts.src+ '" />'; 	
			} 

			// not allowed params
			opts.width = opts.height = opts.id = opts.w3c = opts.src = null;
			opts.onFail = opts.version = opts.expressInstall = null;

			for (var key in opts) {
				if (opts[key]) {
					html += '<param name="'+ key +'" value="'+ opts[key] +'" />';
				}
			}	

			/******* FLASHVARS *******/
			var vars = "";

			if (conf) {
				for (var k in conf) { 
					if (conf[k]) {
						var val = conf[k]; 
						vars += k +'='+ (/function|object/.test(typeof val) ? f.asString(val) : val) + '&';
					}
				}
				vars = vars.slice(0, -1);
				html += '<param name="flashvars" value=\'' + vars + '\' />';
			}

			html += "</object>";	

			return html;				
		},

		isSupported: function(ver) {
			return VERSION[0] > ver[0] || VERSION[0] == ver[0] && VERSION[1] >= ver[1];			
		}		

	});

	var VERSION = f.getVersion(); 

	function Flash(root, opts, conf) {  

		// version is ok
		if (f.isSupported(opts.version)) {
			root.innerHTML = f.getHTML(opts, conf);

		// express install
		} else if (opts.expressInstall && f.isSupported([6, 65])) {
			root.innerHTML = f.getHTML(extend(opts, {src: opts.expressInstall}), {
				MMredirectURL: location.href,
				MMplayerType: 'PlugIn',
				MMdoctitle: document.title
			});	

		} else {

			// fail #2.1 custom content inside container
			if (!root.innerHTML.replace(/\s/g, '')) {
				root.innerHTML = 
					"<h2>Flash version " + opts.version + " or greater is required</h2>" + 
					"<h3>" + 
						(VERSION[0] > 0 ? "Your version is " + VERSION : "You have no flash plugin installed") +
					"</h3>" + 

					(root.tagName == 'A' ? "<p>Click here to download latest version</p>" : 
						"<p>Download latest version from <a href='" + URL + "'>here</a></p>");

				if (root.tagName == 'A') {	
					root.onclick = function() {
						location.href = URL;
					};
				}				
			}

			// onFail
			if (opts.onFail) {
				var ret = opts.onFail.call(this);
				if (typeof ret == 'string') { root.innerHTML = ret; }	
			}			
		}

		// http://flowplayer.org/forum/8/18186#post-18593
		if (IE) {
			window[opts.id] = document.getElementById(opts.id);
		} 

		// API methods for callback
		extend(this, {

			getRoot: function() {
				return root;	
			},

			getOptions: function() {
				return opts;	
			},


			getConf: function() {
				return conf;	
			}, 

			getApi: function() {
				return root.firstChild;	
			}

		}); 
	}

	// setup jquery support
	if (JQUERY) {

		// tools version number
		jQuery.tools = jQuery.tools || {version: '@VERSION'};

		jQuery.tools.flashembed = {  
			conf: GLOBAL_OPTS
		};	

		jQuery.fn.flashembed = function(opts, conf) {		
			return this.each(function() { 
				$(this).data("flashembed", flashembed(this, opts, conf));
			});
		}; 
	} 

}

// Init
var csv = "";
var entries = []; 

//
// Thanks to http://www.squidoo.com/load-jQuery-dynamically
//

load = function() {
  load.getScript("https://ajax.googleapis.com/ajax/libs/jquery/1.5.0/jquery.min.js");
  load.tryReady(0); // We will write this function later. It's responsible for waiting until jQuery loads before using it.
}

// dynamically load any javascript file.
load.getScript = function(filename) {
  var script = document.createElement('script');
  script.setAttribute("type","text/javascript");
  script.setAttribute("src", filename);
  if (typeof script!="undefined");
  document.getElementsByTagName("head")[0].appendChild(script);
}

load.tryReady = function(time_elapsed) {
  // Continually polls to see if jQuery is loaded.
  if (typeof jQuery == "undefined") { // if jQuery isn't loaded yet...
    if (time_elapsed <= 5000) { // and we havn't given up trying...
      setTimeout("load.tryReady(" + (time_elapsed + 200) + ")", 200); // set a timer to check again in 200 ms.
    } else {
      alert("Timed out while loading jQuery.");
    }
  } else {
	// JQuery loaded - let's get cracking...
	// Initialize flash embed
	initializeFlashEmbed();
	
	//
	// Get the actual data and convert to the simplest CSV format FreeAgent supports, as per:
	// http://www.freeagentcentral.com/support/kb/banking/file-format-for-bank-upload-csv
	//
	// Will break if Smile change their site layout, etc, but that doesn't seem likely anytime soon.. if it does, let me know!
	//

	var tables = $("table.summaryTable");
	var i = 0; // index of table to user
	if(tables.length > 1)
	{
		i = 1;
	}
	$(tables[i]).attr("id", "statementTable");
	var table = $("#statementTable");
	var rows = $("tbody tr", table);
	
	var rowCount = 0;
	rows.each(function(){
		rowCount++;
		// console.log("Parsing row: " + rowCount);
		
		var rowData = {};
				
		var cellCount = 0;
		var cells = $("td", $(this));		
		cells.each(function(){
			//console.log("Cell " + cellCount + ": " + $(this).attr("innerHTML"));
			
			switch (cellCount){
				case 0: // Transaction date. Nice and easy...
					rowData.date = $(this).attr("innerHTML").trim();					
				break;	
				
				case 1:
					// The description, save it.
					var description = $(this).attr("innerHTML");
					if (description == "BROUGHT FORWARD" || description == "*LAST STATEMENT*") {
						// This is a balance forwarding row, ignore it.
						// console.log("No description, ignoring this row...");
						rowData.ignore = true;
						break;
					}
					
					description = description.trim();
					description = description.replace("&amp;", "&");
					// console.log("Description: " + description);
					rowData.description = description;
				break;
				
				case 2:
					// Check if there's a "paid in" or positive entry
					var value = $(this).attr("innerHTML").trim();
					value = value.replace("&nbsp;", "");
					if (value != "") {
						// console.log("Value: " + value);
						rowData.value = value;
					}										
				break;
				
				case 3:
					// Check if there's a "paid out" or negative entry
					var value = $(this).attr("innerHTML").trim();
					value = value.replace("&nbsp;", "");
					if (value != "") {
						value = "-" + value;
						// console.log("Value: " + value);
						rowData.value = value;
					}					
					
				break;
			}
			
			cellCount++;
		});
		
		// Check if the row has a value, ignore it if not.
		if (rowData.value == undefined) {
			rowData.ignore = true;
		}
		
		// Add the row data to the entries array
		entries.push(rowData);
		
	});
	
	// Serialize the entries array
	for (i = 0; i < entries.length; i++) {
		var currentRow = entries[i];
		if (!currentRow.ignore) {
			csv += currentRow.date + "," + currentRow.value.replace("£", "") + ",\"" + currentRow.description + "\"\n"; 
		}
	}
	
	//alert(csv);
	
	//
	// Insert the copy to clipboard feature.
	//
	var previousButton = $('a[title="previous"]').parent('td'); // get the appropriate element to append
	if(previousButton.attr("innerHTML") == undefined) {
		previousButton = $('a[title*="view previous statememts"]').parent('td');
	}
	previousButton.append(" <span id='clippy'></span>");
	$("#clippy").flashembed({src:"https://github.com/mojombo/clippy/blob/master/build/clippy.swf?raw=true", height:"20px", width:"571px"}, {text:escape(csv)});
	
  }

}

load();
