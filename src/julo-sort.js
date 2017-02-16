
var JuloTable;
var SortingCriteria;
var ListMap;

(function() {
	

	ListMap = function() {
		this.list = [];
		this.map = {};
	};
	
	ListMap.prototype.getByKey = function(key) {
		return this.map[key];
	};
	
	ListMap.prototype.add = function(key, elem) {
		this.map[key] = elem;
		this.list.push(elem);
	};
	
	ListMap.prototype.clear = function() {
		this.list = [];
		this.map = {};
	};
	
	JuloTable = function(target, options, context) {
		this.target = target;
		this.options = options;
		this.context = context;
		
		this.head = $("thead", this.target);
		this.body = $("tbody", this.target);
		
		if(this.body.length != 1)
			throw new Error(this.body.length + " bodies found");
		
		if(!options || !options.columns || !("length" in options.columns))
			throw new Error("no columns");
		
		this.columnsById = {};
		
		if("defaultSortingKey" in options) {
			this.sortingKey = options.defaultSortingKey;
		} else {
			console.log("Warning: no default sorting for table");
		}
	};
	JuloTable.prototype.drawHeader = function() {
		var row = $("<tr></tr>");
		for(var c in this.options.columns) {
			var col = this.options.columns[c];
			this.columnsById[col.id] = col;
			
			var th = $("<th></th>");
			var toc = typeof col.caption;
			var caption;
			if(toc == "string") {
				caption = col.caption;
			} else if(toc == "function") {
				caption = col.caption(this.context);
			} else {
				throw new Error("Invalid type of caption: " + toc);
			}
			
			th.html(caption);
			th.addClass("column_" + col.id);
			
			if("sorting" in col) {
				th.addClass("sortable");
				th.on("click", this.clickHandler(col));
			}
			
			row.append(th);
		}
		
		this.head.append(row);
		if(this.sortingKey) {
			this.getTh(this.sortingKey.columnId).addClass(sortingClass(this.sortingKey.dir));
		}
	};
	
	function sortingClass(dir) {
		return "sorting_" + dir;
	}
	
	JuloTable.prototype.clickHandler = function(col) {
		return $.proxy(function() {
			var currentKey = this.sortingKey;
			var dir;
			
			if(currentKey.columnId == col.id) {
				if(currentKey.dir == "asc") {
					dir = "desc";
					this.getTh(col.id).removeClass(sortingClass("asc")).addClass(sortingClass("desc"));
				} else {
					dir = "asc";
					this.getTh(col.id).removeClass(sortingClass("desc")).addClass(sortingClass("asc"));
				}
			} else {
				dir = col.defaultDir;
				this.getTh(currentKey.columnId).removeClass(sortingClass(currentKey.dir));
				this.getTh(col.id).addClass(sortingClass(dir));
			}
			
			this.setSorting({columnId: col.id, dir: dir});
		}, this);
	};
	JuloTable.prototype.getTh = function(columnId) {
		var str = "th.column_" + columnId;
		var ret = $(str, this.head);
		
		if(ret.length != 1) {
			throw new Error(ret.length + " ths found with '" + str + "'");
		}
		
		return ret;
	}
	
	JuloTable.prototype.getSorting = function(sortingKey) {
		var ret = this.columnsById[sortingKey.columnId].sorting[sortingKey.dir];
		
		return ret;
	}
	
	JuloTable.prototype.setData = function(data) {
		if(!data)
			throw new Error("Invalid data: " + data);
		this.data = data;
		
		this.mainData = [];
		this.othrData = [];
		
		for(var d in data) {
			var datum = data[d];
			if(!("mainFilter" in this.options) || this.options.mainFilter(datum)) {
				this.mainData.push(datum);
				datum.isMain = true;
			} else {
				this.othrData.push(datum);
				datum.isMain = false;
			}
		}
		
		this.clearHeader();
		this.clearTable();
		this.drawHeader();
		
		this.sort();
		
		this.fillTable();
	};
	
	JuloTable.prototype.setSorting = function(newSortingKey) {
		this.sortingKey = newSortingKey;
		this.sort();
		
		this.sortTable();
		
		if("onSort" in this.options)
			this.options.onSort(this.context);
	};
	
	JuloTable.prototype.sort = function() {
		var sorting = this.getSorting(this.sortingKey);
		this.data.sort(sorting);
		
		this.mainData.sort(sorting);
		this.othrData.sort(sorting);
	};
	
	JuloTable.prototype.clearHeader = function() {
		this.head.empty();
	};
	JuloTable.prototype.clearTable = function() {
		this.body.empty();
	};
	
	JuloTable.prototype.sortTable = function() {
		for(var d = this.mainData.length - 1; d >= 0; d--) {
			var entry = this.mainData[d];
			var row = $("#" + JuloTable.getEntryId(entry));
			this.body.prepend(row);
		}
		for(var d = 0; d < this.othrData.length; d++) {
			var entry = this.othrData[d];
			var row = $("#" + JuloTable.getEntryId(entry));
			this.body.append(row);
		}
	};
	
	JuloTable.prototype.fillTable = function() {
		for(var d in this.mainData) {
			this.addRow(this.mainData[d]);
		}
		
		if(this.mainData.length != 0 && this.othrData.length != 0) {
			var separator = $("<tr class='julotable_separator'><td colspan=" + this.options.columns.length + ">" + this.getSeparatorContent() + "</td></tr>");
			this.body.append(separator);
		}
		
		for(var d in this.othrData) {
			this.addRow(this.othrData[d]);
		}
		
		if(this.mainData.length + this.othrData.length == 0) {
			this.body.append($("<td colspan='" + this.options.columns.length + "'>" + "No hay ning&uacute;n registro que mostrar" + "</td>"));
		}
	};
	JuloTable.prototype.getSeparatorContent = function() {
		var ret;
		if(!"separatorContent" in this.options) {
			ret = "-";
		} else {
			var sep = this.options.separatorContent;
			var tosep = typeof sep;
			
			if(tosep == "string") {
				ret = this.options.separatorContent;
			} else if(tosep == "function") {
				ret = this.options.separatorContent();
			} else {
				throw new Error("Invalid options.separatorContent");
			}
		}
		return ret;
	};
	JuloTable.getEntryId = function(entry) {
		return "julotable_entry_" + entry.key;
	};
	JuloTable.prototype.addRow = function(entry) {
		var row = $("<tr id='" + JuloTable.getEntryId(entry) + "'></tr>");
		
		row.addClass(entry.isMain ? "mainItem" : "othrItem");
		
		for(var c in this.options.columns) {
			var col = this.options.columns[c];
			var toc = typeof col.content;
			var content;
			
			if(toc == "function") {
				content = col.content(entry, this.context);
			} else if(toc == "string") {
				content = JuloUtil.format(col.content, entry);
			} else {
				throw new Error("Column content of type '" + toc + "'");
			}
			
			var cell = $("<td></td>");
			cell.addClass("cell_" + col.id);
			cell.html(content);
			
			row.append(cell);
		}
		this.body.append(row);
	};
	
	SortingCriteria = function(evaluateMethod, sortingMethod) {
		this.sort = sortingMethod;
		this.evaluate = evaluateMethod;
	};
	
	SortingCriteria.prototype.getWorst = function(registers) {
		return this.getBest(registers, true);
	};
	
	SortingCriteria.prototype.getBest = function(registers, invert) {
		if(!registers.length)
			return [];
		
		registers.sort(invert ? inverse(this.sort) : this.sort);
		var ret = [];
		
		var bestValue = this.evaluate(registers[0]);
		ret.push(registers[0]);
		
		var i = 1;
		while(i < registers.length) {
			var r = registers[i];
			var val = this.evaluate(r);
			
			if(val == bestValue) {
				ret.push(r);
				i++;
			} else {
				break;
			}
		}
		return ret;
	};
	
	function inverse(sortingMethod) {
		return function(r1, r2) {
			return -sortingMethod(r1, r2);
		}
	}
	
})();
