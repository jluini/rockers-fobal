
var RFPage;

(function() {
	var selected = null;
	
	RFPage = function(matches, options) {
		this.options = options;
		this.rf = new RockersFobal();
		for(var m in matches) {
			var match = matches[m];
			this.rf.addMatch(match);
		}
		
		this.rf.setPeriod(getSeasonById(options.seasonId));
		
		var playerMinimum = this.options.filters.minimumPlayerAttendance;
		var coupleMinimum = this.options.filters.minimumCoupleAttendance;
		var triadMinimum  = this.options.filters.minimumTriadAttendance;
		
		this.playerTable = this.newScoreTable(
			"#playerTable",
			playerMinimum,
			"Jugadores con menos de " + playerMinimum + "% de partidos jugados:"
		);
		this.coupleTable = this.newScoreTable(
			"#coupleTable",
			coupleMinimum,
			"D&uacute;os con menos de " + coupleMinimum + "% de partidos jugados:"
		);
		this.triadTable = this.newScoreTable(
			"#triadTable",
			triadMinimum,
			"Tr&iacute;adas con menos de " + triadMinimum + "% de partidos jugados:"
		);
		
		this.hthTable = new JuloTable($("#hthTable"), this.hthColumnConfiguration(), this);
		
		this.allMatches = this.rf.getAllMatches();
		this.allPlayerScores = this.rf.getPlayerScores();
		this.showHistory();
		
		this.recalculate();
		this.addHooks();
		
		var tabsContainer = $("#tabs");
		tabsContainer.tabs({active: this.options.activeIndex});
		tabsContainer.show();
		
		var periodSelect = $("#periodSelect");
		periodSelect.val(this.options.seasonId);
		
		periodSelect.change($.proxy(function() {
			this.options.seasonId = periodSelect.val();
			this.rf.setPeriod(getSeasonById(this.options.seasonId));
			this.recalculate();
			this.addHooks();
		}, this));
	};
	RFPage.prototype.newScoreTable = function(tableId, minimumAttendance, separatorStr) {
		return new JuloTable(
			$(tableId),
			this.scoreColumnConfiguration(this.checkAttendance(minimumAttendance), separatorStr),
			this
		);
	};
	RFPage.prototype.checkAttendance = function(minimum) {
		return $.proxy(function(score) {
			var att = 100 * score.total / this.rf.getTotal();
			return att >= minimum;
		}, this);
	};
	function getSeasonById(seasonId) {
		var startDate, endDate;
		if(seasonId == "2016") {
			startDate = new Date(2016,  0, 1);
			endDate   = new Date(2016, 11, 31);
		} else if(seasonId == "global") {
			startDate = new Date(1917,  0, 1);
			endDate   = new Date(3017, 11, 31);
		} else {
			seasonId = "2017";
			startDate = new Date(2017,  0, 1);
			endDate   = new Date(2017, 11, 31);
		}
		
		return {
			seasonId: seasonId,
			startDate: startDate,
			endDate: endDate
		};
	}
	
	RFPage.prototype.hthColumnConfiguration = function() {
		return {
		//onSort: function(env) { },
		mainFilter: function() { return true; },
			
		defaultSortingKey: {  columnId: "ratio", dir: "desc" },
		columns: [
			{
				id: "name",
				caption: "Duelo",
				content: function(reg, rfPage) {
					var p1 = reg.getPlayer(0);
					var key1 = p1.key;
					var name1 = p1.name;
					var p2 = reg.getPlayer(1);
					var key2 = p2.key;
					var name2 = p2.name;
					return "<span class='player player_" + key1 + "'>" + name1 + "</span> vs. <span class='player player_" + key2 + "'>" + name2 + "</span>";
				}
			}, {
				id: "total",
				caption: "Encuentros",
				//content: "{total}",
				content: function(reg, rfPage) {
					var total = reg.total;
					var attendance = 100 * total / rfPage.rf.getTotal();
					return total + " (" + attendance.toFixed(1) + "%)";
				},
				sorting: {
					asc: function(s1, s2) {
						return s1.total - s2.total;
					},
					desc: function(s1, s2) {
						return s2.total - s1.total;
					}
				},
				defaultDir: "desc"
			}, {
				id: "ratio",
				caption: "Promedio",
				content: function(reg, rfPage) {
					if(reg.total == 0) {
						return "-";
					}
					
					var ratios = reg.getRatios();
					var ra = JuloUtil.formatPercentage(ratios[0]); // Math.round(ratios[0]) + "%";
					var rb = JuloUtil.formatPercentage(ratios[1]); // Math.round(ratios[1]) + "%";
					return ra + " - " + rb;
				},
				sorting: {
					asc: function(s1, s2) {
						return s1.getRatios()[0] - s2.getRatios()[0] || s2.total - s1.total;
					},
					desc: function(s1, s2) {
						return s2.getRatios()[0] - s1.getRatios()[0] || s2.total - s1.total;
					}
				},
				defaultDir: "desc"
			}, {
				id: "won",
				caption: "Ganados",
				content: function(reg, rfPage) {
					var wons = reg.getWons();
					var wa = wons[0];
					var wb = wons[1];
					return wa + " - " + wb;
				},
				sorting: {
					asc: function(s1, s2) {
						return s1.getWons()[0] - s2.getWons()[0] || s2.total - s1.total;
					},
					desc: function(s1, s2) {
						return s2.getWons()[0] - s1.getWons()[0] || s2.total - s1.total;
					}
				},
				defaultDir: "desc"
			}
		]
		}
	};
	RFPage.prototype.scoreColumnConfiguration = function(mainFilter, separatorStr) {
		return {
		mainFilter: mainFilter,
		separatorContent: function() {
			return separatorStr;
		},
		
		defaultSortingKey: { columnId: "ratio", dir: "desc" },
		columns: [
			{
				id: "name",
				caption: "Nombre",
				content: function(reg, rfPage) {
					var ret = "";
					for(var i = 0; i < reg.players.length; i++) {
						var player = reg.players[i];
						if(i > 0)
							ret = ret.concat("-");
						ret = ret.concat("<span class='player player_", player.key, "'>", player.name, "</span>");
					}
					return ret;
				},
				sorting: {
					asc:  function(s1, s2) { return s1.name.localeCompare(s2.name); },
					desc: function(s1, s2) { return s2.name.localeCompare(s1.name); },
				},
				defaultDir: "asc"
			}, {
				id: "ratio",
				caption: "Promedio",
				content: function(reg, rfPage) {
					return reg.total == 0 ? "-" : JuloUtil.formatPercentage(reg.ratio);
				},
				sorting: {
					asc:  function(s1, s2) {
						return s1.ratio - s2.ratio || s2.total - s1.total;
					},
					desc: function(s1, s2) {
						return s2.ratio - s1.ratio || s2.total - s1.total;
					}
				},
				defaultDir: "desc"
			}, /*{
				id: "attendance",
				caption: "Participaci&oacute;n",
				content: function(reg, rfPage) {
					var attendance = 100 * reg.total / rfPage.rf.getTotal();
					return JuloUtil.formatPercentage(attendance);
				},
				sorting: {
					asc:  function(s1, s2) {
						return s1.total - s2.total;
					},
					desc: function(s1, s2) {
						return s2.total - s1.total;
					}
				},
				defaultDir: "desc"
			}, */{
				id: "won",
				caption: "Ganados",
				content: function(reg, rfPage) {
					return reg.count[RockersFobal.TEAM_WON]
				},
				sorting: {
					asc:  function(s1, s2) { return s1.won() - s2.won() || s2.total - s1.total; },
					desc: function(s1, s2) { return s2.won() - s1.won() || s2.total - s1.total; }
				},
				defaultDir: "desc"
			}, {
				id: "lost",
				caption: "Perdidos",
				content: function(reg, rfPage) { return reg.count[RockersFobal.TEAM_LOST] },
				sorting: {
					asc:  function(s1, s2) { return s1.lost() - s2.lost() || s2.total - s1.total; },
					desc: function(s1, s2) { return s2.lost() - s1.lost() || s2.total - s1.total; },
				},
				defaultDir: "desc"
			}, {
				id: "total",
				caption: "Jugados",
				content: function(reg, rfPage) {
					var total = reg.total;
					var attendance = 100 * total / rfPage.rf.getTotal();
					return total + " (" + JuloUtil.formatPercentage(attendance) + ")";
				},
				sorting: {
					asc:  function(s1, s2) { return s1.total - s2.total; },
					desc: function(s1, s2) { return s2.total - s1.total; }
				},
				defaultDir: "desc"
			},
			{
				id: "dots",
				caption: function(rfPage) {
					var monthKeys = ['e', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'];
					var ret = "";
					var lastMonth = -1;
					for(var i = 0; i < rfPage.matches.length; i++) {
						var match = rfPage.matches[i];
						var month = match.date.getMonth();
						
						if(month != lastMonth) {
							lastMonth = month;
							ret = ret.concat("<div class='matchIcon matchIconHeader'>", monthKeys[month], "</div>");
						} else {
							ret = ret.concat("<div class='matchIcon matchIconHeader matchIconEmpty'>", "." , "</div>");
						}
						
					}
					
					return ret;
				},
				content: function(reg, rfPage) {
					var ret = "";
					for(var i = 0; i < rfPage.matches.length; i++) {
						var match = rfPage.matches[i];
						var resultForTeam = match.getResultForTeam(reg.players, match);
						var boxClass = "None";
						var boxContent = "-";
						if(resultForTeam == RockersFobal.RESULT_WON) {
							boxClass = "Won";
							boxContent = "o";
						} else if(resultForTeam == RockersFobal.RESULT_LOST) {
							boxClass = "Lost";
							boxContent = "x";
						} else if(resultForTeam == RockersFobal.RESULT_TIED) {
							boxClass = "Tied";
							boxContent = "~";
						}
						
						ret = ret.concat("<div class='matchIcon matchIcon", boxClass, "'>", boxContent, "</div>");
					}
					return ret;
				}
			}
		]
		}
	};
	
	RFPage.prototype.recalculate = function() {
		this.matches = this.rf.getMatches();
		this.playerScores = this.rf.getPlayerScores();
		this.coupleScores = this.rf.getCoupleScores();
		this.triadScores  = this.rf.getTriadScores();
		this.hthScores = this.rf.getHthScores();
		
		this.playerTable.setData(this.playerScores);
		this.coupleTable.setData(this.coupleScores);
		this.triadTable.setData(this.triadScores);
		this.hthTable.setData(this.hthScores);
		
		$("#totalDisplay").text(this.rf.getTotal());
	};
	
	RFPage.prototype.addHooks = function() {
		var matchingElems = $(".player");
		
		matchingElems.unbind("click");
		matchingElems.on("click", $.proxy(function(event) {
			var elem = $(event.toElement);
			var classes = elem.attr("class").split(/\s+/);
			var selected = false;
			var playerClass;
			for(var i = 0; i < classes.length; i++) {
				var cls = classes[i];
				if(cls == "player_selected") {
					selected = true;
				} else if(cls != "player") {
					playerClass = cls;
				}
			}
			var matchingElems = $("." + playerClass);
			
			if(selected) {
				matchingElems.removeClass("player_selected");
			} else {
				matchingElems.addClass("player_selected");
			}
		}, this));
	};
	
	RFPage.prototype.showHistory = function() {
		this.showHist($("#2017matchRowModel"), this.allMatches.filter(yearFilter(2017)));
		this.showHist($("#2016matchRowModel"), this.allMatches.filter(yearFilter(2016)));
	};
	
	function yearFilter(year) {
		return (function(match) {
			return match.date.getFullYear() == year;
		});
	}
	function htmlNames(team) {
		var ret = "";
		for(var i = 0; i < team.length; i++) {
			var player = team[i];
			if(i > 0)
				ret = ret.concat("/");
			ret = ret.concat("<span class='player player_", player.key, "'>", player.name, "</span>");
		}
		return ret;
	}
	RFPage.prototype.showHist = function(model, matches) {
		var dataSet = [];
		
		model.parent().empty().append(model);
		
		for(var m in matches) {
			var match = matches[m];
			
			var newRow = model.clone();
			
			$(".fieldDate", newRow).text(JuloUtil.dateToString(match.date));
			
			var fieldLocal = $(".fieldLocal", newRow);
			fieldLocal.html(htmlNames(match.localTeam));
			addClassToResult(fieldLocal, match.localResult);
			
			var fieldVisitor = $(".fieldVisitor", newRow);
			fieldVisitor.html(htmlNames(match.visitorTeam));
			addClassToResult(fieldVisitor, match.visitorResult);
			
			$(".fieldResult", newRow).text(match.scoreKeeper);
			
			newRow.insertAfter(model);
			newRow.show();
		}
	};
	
	function addClassToResult(resultElem, teamResult) {
		if(teamResult == RockersFobal.TEAM_WON)
			resultElem.addClass("winner");
		else if(teamResult == RockersFobal.TEAM_LOST)
			resultElem.addClass("loser");
	}
})();
