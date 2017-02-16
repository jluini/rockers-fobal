var RockersFobal;

(function() {
	
	/**
	 * RockersFobal.
	 */
	RockersFobal = function() {
		this.allMatches = [];
		this.allPlayers = [];
		
		this.matches = [];
		
		this.playerScoreMap = new ListMap();
		this.coupleScoreMap = new ListMap();
		this.triadScoreMap  = new ListMap();
		this.hthScoreMap    = new ListMap();
	};
	
	RockersFobal.RESULT_NONE = 0;
	RockersFobal.RESULT_WON  = 1;
	RockersFobal.RESULT_LOST = 2;
	RockersFobal.RESULT_TIED = 3;
	
	RockersFobal.prototype.setPeriod = function(period) {
		this.startDate = period.startDate;
		this.endDate = period.endDate;
		
		this.matches = [];
		this.playerScoreMap.clear();
		this.coupleScoreMap.clear();
		this.triadScoreMap.clear();
		this.hthScoreMap.clear();
		
		var numMatches = this.allMatches.length;
		for(var m = 0; m < numMatches; m++) {
			var match = this.allMatches[m];
			if(this.isWithinPeriod(match)) {
				this.matches.push(match);
				this.registerMatch(match);
			}
		}
	};
	
	RockersFobal.prototype.registerMatch = function(match) {
		this.registerTeamResult(match.localTeam,   match.localResult);
		this.registerTeamResult(match.visitorTeam, match.visitorResult);
		
		// register hth
		for(var lp = 0; lp < match.localTeam.length; lp++) {
			for(var vp = 0; vp < match.visitorTeam.length; vp++) {
				var localPlayer = match.localTeam[lp];
				var visitorPlayer = match.visitorTeam[vp];
				
				var couple = [localPlayer, visitorPlayer];
				
				couple.sort(function(a, b) {
					return a.key.localeCompare(b.key);
				});
				var invert = couple[0] != localPlayer;
				
				var score = this.getHthScore(couple);
				
				var resultFlag = match.resultFlag;
				if(invert) {
					if(resultFlag == MATCH_LOCAL_WON) {
						resultFlag = MATCH_VISITOR_WON;
					} else if(resultFlag == MATCH_VISITOR_WON) {
						resultFlag = MATCH_LOCAL_WON;
					}
				}
				score.addResult(resultFlag);
			}
		}
	};
	
	RockersFobal.prototype.registerTeamResult = function(team, result) {
		// players
		for(var p in team) {
			var player = team[p];
			var score = this.getPlayerScore(player);
			score.addRegister(result);
		}
		
		// couples
		for(var p1 = 0; p1 < team.length; p1++) {
			for(var p2 = p1 + 1; p2 < team.length; p2++) {
				var player1 = team[p1];
				var player2 = team[p2];
				var couple = [player1, player2];
				// TODO is right to sort here?
				couple.sort(function(a, b) {
					return a.key.localeCompare(b.key);
				});
				
				var score = this.getCoupleScore(couple);
				score.addRegister(result);
			}
		}
		
		// triads
		for(var p1 = 0; p1 < team.length; p1++) {
			for(var p2 = p1 + 1; p2 < team.length; p2++) {
				for(var p3 = p2 + 1; p3 < team.length; p3++) {
					var player1 = team[p1];
					var player2 = team[p2];
					var player3 = team[p3];
					
					var triad = [player1, player2, player3];
					triad.sort();
					
					var score = this.getTriadScore(triad);
					score.addRegister(result);
				}
			}
		}
	};
	function getTeamKey(team) {
		return joinProperty(team, "key", "-");
	}
	function getTeamName(team) {
		return joinProperty(team, "name", "-");
	}
	function joinProperty(elems, prop, separator) {
		var ret = "";
		for(var i = 0; i < elems.length; i++) {
			var elem = elems[i];
			
			if(i > 0)
				ret = ret.concat(separator);
			
			ret = ret.concat(elem[prop]);
		}
		return ret;
	}
	RockersFobal.prototype.getPlayerScore = function(player) {
		var team = [player];
		var key = getTeamKey(team);
		var ret = this.playerScoreMap.getByKey(key);
		if(!ret) {
			ret = new TeamScore(key, team);
			this.playerScoreMap.add(key, ret);
		}
		return ret;
	};
	RockersFobal.prototype.getCoupleScore = function(couple) {
		var key = getTeamKey(couple);
		var ret = this.coupleScoreMap.getByKey(key);
		if(!ret) {
			ret = new TeamScore(key, couple);
			this.coupleScoreMap.add(key, ret);
		}
		return ret;
	};
	RockersFobal.prototype.getTriadScore = function(triad) {
		var key = getTeamKey(triad);
		var ret = this.triadScoreMap.getByKey(key);
		if(!ret) {
			ret = new TeamScore(key, triad);
			this.triadScoreMap.add(key, ret);
		}
		return ret;
	};
	RockersFobal.prototype.getHthScore = function(couple) {
		if(couple.length != 2 || couple[0].key.localeCompare(couple[1].key) != -1) {
			throw new Error("Invalid or unordered couple: " + couple);
		}
		
		var ret = this.hthScoreMap.getByKey(couple);
		if(!ret) {
			ret = new HthScore(couple);
			this.hthScoreMap.add(couple, ret);
		}
		return ret;
	};
	RockersFobal.prototype.isWithinPeriod = function(match) {
		return this.startDate <= match.date && match.date <= this.endDate;
	};

	RockersFobal.prototype.getMatches = function() {
		return this.matches;
	};

	RockersFobal.prototype.getAllMatches = function() {
		return this.allMatches;
	};
	
	RockersFobal.prototype.getTotal = function() {
		return this.matches.length;
	};
	
	RockersFobal.prototype.addMatch = function(matchStr) {
		var match = new Match(matchStr, this);
		
		this.allMatches.push(match);
	};
	
	RockersFobal.prototype.getPlayerScores = function() {
		return this.playerScoreMap.list;
	};
	
	RockersFobal.prototype.getCoupleScores = function() {
		return this.coupleScoreMap.list;
	};
	RockersFobal.prototype.getTriadScores = function() {
		return this.triadScoreMap.list;
	};
	RockersFobal.prototype.getHthScores = function() {
		return this.hthScoreMap.list;
	};
	
	RockersFobal.prototype.getPlayer = function(key) {
		var numPlayers = this.allPlayers.length;
		for(var p = 0; p < numPlayers; p++) {
			var player = this.allPlayers[p];
			if(player.key == key) {
				return player;
			}
		}
		
		var player = new Player(key, JuloUtil.capitalizeFirst(key));
		this.allPlayers.push(player);
		return player;
	};
	
	// static members
	RockersFobal.byWon = new SortingCriteria(
		function(score) {
			return score.won;
		},
		function(s1, s2) {
			return s2.won - s1.won;
		}
	);
	RockersFobal.byRatio = new SortingCriteria(
		function(score) {
			return score.ratio;
		},
		function(s1, s2) {
			return s2.ratio - s1.ratio;
		}
	);
	RockersFobal.byTotal = new SortingCriteria(
		function(score) {
			return score.total;
		},
		function(s1, s2) {
			return s2.total - s1.total;
		}
	);

	/**
	 * TeamScore.
	 */
	function TeamScore(key, players) {
		this.key = key;
		this.players = players;
		this.name = getTeamName(players);
		
		this.count = {};
		this.count[RockersFobal.TEAM_WON] = 0;
		this.count[RockersFobal.TEAM_TIED] = 0;
		this.count[RockersFobal.TEAM_LOST] = 0;
		this.total = 0;
		this.ratio = -1;
	}
	TeamScore.prototype.addRegister = function(result) {
		this.count[result]++;
		this.total++;
		this.ratio = 100 * this.count[RockersFobal.TEAM_WON] / this.total;
	};
	TeamScore.prototype.toString = function() {
		return this._getInfo();
	}
	TeamScore.prototype.won  = function() { return this.count[RockersFobal.TEAM_WON]; };
	TeamScore.prototype.lost = function() { return this.count[RockersFobal.TEAM_LOST]; };
	TeamScore.prototype.tied = function() { return this.count[RockersFobal.TEAM_TIED]; };
	
	function HthScore(couple) {
		this.key = couple[0].key + "-vs-" + couple[1].key;
		this.couple = couple;
		this.register = [0, 0, 0]
		this.invert = false;
		this.total = 0;
	}
	HthScore.prototype.addResult = function(result) {
		this.register[result]++;
		this.total++;
		this.invert = this.register[1] > this.register[0];
	};
	
	HthScore.prototype.getRatios = function() {
		var total = this.total;
		if(total == 0) {
			console.log("Warning loco");
			return [0, 0];
		}
		return [
			this.register[this.index(0)] * 100 / total,
			this.register[this.index(1)] * 100 / total
		];
	};
	HthScore.prototype.getWons = function() {
		return [
			this.register[this.index(0)],
			this.register[this.index(1)]
		];
	};
	
	
	HthScore.prototype.index = function(i) {
		if(i != 0 && i != 1)
			throw Error("Invalid index");
		return this.invert ? i * -1 + 1 : i;
	};
	HthScore.prototype.getPlayer = function(i) {
		return this.couple[this.index(i)];
	};
	
	function Player(key, name) {
		this.key = key;
		this.name = name;
	}
	Player.prototype.toString = function() {
		return this.name;
	};
	
	/**
	 * Match.
	 */
	function Match(matchStr, fobal) {
		this.str = matchStr;
		
		var pattern = /^\s*([0-9\/]+)\s+([a-z\/]+)\s+([0-9\-]+)\s+([a-z\/]+)\s*$/;
		
		var indexOfDate    = 1;
		var indexOfLocal   = 2;
		var indexOfResult  = 3;
		var indexOfVisitor = 4;
		
		var m = pattern.exec(matchStr);
		if(!m) throw new Error("Invalid match string");
		
		// TODO refactor results
		
		this.date = JuloUtil.dateFromString(m[indexOfDate]);// new JuloDate(m[indexOfDate]);
		this.date.setHours(23);
		this.scoreKeeper = this.parseResult(m[indexOfResult]);
		this.localTeam   = this.parseTeam(m[indexOfLocal], fobal);
		this.visitorTeam = this.parseTeam(m[indexOfVisitor], fobal);
		
		if(this.scoreKeeper.team1 < 0 || this.scoreKeeper.team2 < 0) {
			throw new Error("Resultado invalido");
		} else if(this.scoreKeeper.team1 > this.scoreKeeper.team2) {
			this.resultFlag = MATCH_LOCAL_WON;
			this.localResult = RockersFobal.TEAM_WON;
			this.visitorResult = RockersFobal.TEAM_LOST;
		} else if(this.scoreKeeper.team1 < this.scoreKeeper.team2) {
			this.resultFlag = MATCH_VISITOR_WON;
			this.localResult = RockersFobal.TEAM_LOST;
			this.visitorResult = RockersFobal.TEAM_WON;
		} else {
			this.resultFlag = MATCH_TIED;
			this.localResult = RockersFobal.TEAM_TIED;
			this.visitorResult = RockersFobal.TEAM_TIED;
		}
	}
	
	var MATCH_LOCAL_WON   = 0;
	var MATCH_VISITOR_WON = 1;
	var MATCH_TIED        = 2;
	
	RockersFobal.TEAM_WON  = 0;
	RockersFobal.TEAM_LOST = 1;
	RockersFobal.TEAM_TIED = 2;
	
	Match.prototype.parseTeam = function(str, fobal) {
		var ret = []; // new Team();
		var playerNames = str.split("/").sort(function(a, b) { return a.localeCompare(b); });
		
		for(var p = 0; p < playerNames.length; p++) {
			ret.push(fobal.getPlayer(playerNames[p]));
		}
		// TODO check length ?
		//if(ret.length != 5)
			//console.warn("Warning: team hasn't five players (" + ret.length + ")");
		
		return ret;
	};
	
	Match.prototype.parseResult = function(str) {
		var pattern = /([0-9]+)\-([0-9]+)/;
		var m = pattern.exec(str);
		
		return new ScoreKeeper(parseInt(m[1], 10), parseInt(m[2], 10));
	};
	
	Match.prototype.toString = function() {
		return this.localTeam + " /// " + this.scoreKeeper;
	};
	
	Match.prototype.getWinner = function() {
		if(this.resultFlag == MATCH_LOCAL_WON) {
			return this.localTeam;
		} else if(this.resultFlag == MATCH_VISITOR_WON) {
			return this.visitorTeam;
		} else {
			return null;
		}
	};
	
	Match.prototype.isPresent = function(player) {
		return this.isLocal(player) || this.isVisitor(player);
	};
	Match.prototype.isWinner = function(player) {
		return (this.resultFlag == MATCH_LOCAL_WON   && this.isLocal(player))
		    || (this.resultFlag == MATCH_VISITOR_WON && this.isVisitor(player));
	};
	Match.prototype.isLoser = function(player) {
		return (this.resultFlag == MATCH_LOCAL_WON   && this.isVisitor(player))
		    || (this.resultFlag == MATCH_VISITOR_WON && this.isLocal(player));
	};
	
	Match.prototype.getResultForTeam = function(team) {
		if(this.areLocal(team)) {
			if(this.resultFlag == MATCH_LOCAL_WON) {
				return RockersFobal.RESULT_WON;
			} else if(this.resultFlag == MATCH_VISITOR_WON) {
				return RockersFobal.RESULT_LOST;
			} else {
				return RockersFobal.RESULT_TIED;
			}
		} else if(this.areVisitor(team)) {
			if(this.resultFlag == MATCH_LOCAL_WON) {
				return RockersFobal.RESULT_LOST;
			} else if(this.resultFlag == MATCH_VISITOR_WON) {
				return RockersFobal.RESULT_WON;
			} else {
				return RockersFobal.RESULT_TIED;
			}
		} else {
			return RockersFobal.RESULT_NONE;
		}
	};
	
	Match.prototype.isLocal = function(player) {
		return this.belongsTo(this.localTeam, player);
	};
	Match.prototype.areLocal = function(players) {
		for(var p in players) {
			var player = players[p];
			if(!this.isLocal(player))
				return false;
		}
		return true;
	};
	
	Match.prototype.isVisitor = function(player) {
		return this.belongsTo(this.visitorTeam, player);
	};
	Match.prototype.areVisitor = function(players) {
		for(var p in players) {
			var player = players[p];
			if(!this.isVisitor(player))
				return false;
		}
		return true;
	};
	
	Match.prototype.belongsTo = function(team, player) {
		for(var p in team) {
			var teamPlayer = team[p];
			if(teamPlayer == player)
				return true;
		}
		return false;
	};
	
	function ScoreKeeper(team1, team2) {
		this.team1 = team1;
		this.team2 = team2;
	}
	ScoreKeeper.prototype.toString = function() {
		return this.team1 + "-" + this.team2;
	};
	
})();
