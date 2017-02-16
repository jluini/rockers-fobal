
var JuloDate;
var JuloUtil;

(function() {
	JuloUtil = {
		capitalizeFirst: function(str) {
			return str[0].toUpperCase().concat(str.substring(1));
		},
		
		format: function(template, obj) {
			return template.replace(/\{([^\{\}])+\}/g, function(placeholder) {
				var key = placeholder.substring(1, placeholder.length - 1);
				return obj[key];
			});
		},
		getURLParameter: function(name) {
			return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
		},
		formatPercentage: function(perc) {
			if((typeof perc) =="number" && !isNaN(perc)) {
				/*if(perc == 0 || perc == 100) {
					return perc + "%";
				} else {
					return perc.toFixed(1) + "%";
				}*/
				var ret = perc.toFixed(1);
				if(ret.substr(-2) == ".0") {
					ret = ret.substr(0, ret.length - 2);
				}
				ret += "%";
				return ret;
			} else {
				return "---"; // TODO ?
			}
		},
		dateFromString: function(dateStr) {
			var pattern = /^\s*([0-9]+)\/([0-9]+)\/([0-9]+)\s*$/;
			
			var indexOfDay = 1;
			var indexOfMonth = 2;
			var indexOfYear = 3;
			
			var m = pattern.exec(dateStr);
			if(!m) throw new Error("Invalid date string");
			
			var day   = parseInt(m[indexOfDay], 10);
			var month = parseInt(m[indexOfMonth], 10);
			var year  = parseInt(m[indexOfYear], 10);
			
			if(isNaN(day) || day < 1 || day > 31)
				throw new Error("Invalid day: " + day);
			if(isNaN(month) || month < 1 || month > 12)
				throw new Error("Invalid month: " + month);
			if(isNaN(year) || year < 1)
				throw new Error("Invalid year: " + year);
			
			return new Date(year, month - 1, day);
		},
		dateToString: function(date) {
			var dd = date.getDate();
			dd = (dd > 9 ? "" : "0") + dd;
			
			var mm = date.getMonth() + 1; // getMonth() is zero-based
			mm = (mm > 9 ? "" : "0") + mm;
			
			var yyyy = date.getFullYear() + "";
			
			return dd + "/" + mm + "/" + yyyy;
		}
	};
	
})();
