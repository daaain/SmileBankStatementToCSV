// Init variables
var csv = "";
var entries = [];

// Thanks to http://www.squidoo.com/load-jQuery-dynamically
function load() {
	getScript("https://ajax.googleapis.com/ajax/libs/jquery/1.8.0/jquery.min.js");
	getScript("https://raw.github.com/fancyapps/fancyBox/master/source/jquery.fancybox.pack.js");
	tryReady(0); // We will write this function later. It's responsible for waiting until jQuery loads before using it.
}

// dynamically load any javascript file.
function getScript(filename) {
	var script = document.createElement('scr'+'ipt');
	script.setAttribute("type","text/javascript");
	script.setAttribute("src", filename);
	document.getElementsByTagName("head")[0].appendChild(script);
}

function tryReady(time_elapsed) {
	// Continually polls to see if jQuery and fancybox are loaded.
	if (typeof jQuery === "undefined" || !('fancybox' in window['jQuery'])) { // if jQuery isn't loaded yet...
		if (time_elapsed <= 5000) { // and we haven't given up trying...
			setTimeout("tryReady(" + (time_elapsed + 200) + ")", 200); // set a timer to check again in 200 ms.
		} else {
			alert("Timed out while loading :( Try again?");
		}
	} else {
		// JQuery loaded - let's get cracking...
		
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
			var value;
			var cellCount = 0;
			var cells = $("td", $(this));
			cells.each(function(){
				//console.log("Cell " + cellCount + ": " + $(this).attr("innerHTML"));
				
				switch (cellCount){
					case 0: // Transaction date. Nice and easy...
						rowData.date = $(this).html().trim();
					break;
					
					case 1:
						// The description, save it.
						var description = $(this).html();
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
						value = $(this).html().trim();
						value = value.replace("&nbsp;", "");
						if (value !== "") {
							// console.log("Value: " + value);
							rowData.value = value;
						}
					break;
					
					case 3:
						// Check if there's a "paid out" or negative entry
						value = $(this).html().trim();
						value = value.replace("&nbsp;", "");
						if (value !== "") {
							value = "-" + value;
							// console.log("Value: " + value);
							rowData.value = value;
						}
						
					break;
				}
				
				cellCount++;
			});
			
			// Check if the row has a value, ignore it if not.
			if (typeof rowData.value === 'undefined') {
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
		
		// show csv content in fancybox
		$.fancybox({
			'content' : csv
		});

		// select text for added convenience
		fnSelect($('.fancybox-inner').get(0));
	}
}

// text selection
function fnSelect(objId) {
	fnDeSelect();
	var range;
	if (document.selection) {
		range = document.body.createTextRange();
		range.moveToElementText(document.getElementById(objId));
		range.select();
	}
	else if (window.getSelection) {
		range = document.createRange();
		range.selectNode(document.getElementById(objId));
		window.getSelection().addRange(range);
	}
}

function fnDeSelect() {
	if (document.selection) document.selection.empty();
	else if (window.getSelection) window.getSelection().removeAllRanges();
}

load();