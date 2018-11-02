/* global Module */

/* Magic Mirror
 * Module: MMM-Weather-SMHI
 *
 * By Fredrick Bäcker
 * MIT Licensed.
 */

Module.register("MMM-Weather-SMHI", {

	// Default module config
	defaults: {
		
		// Where and how to get the weather data
		url:
			"http://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/%s/lat/%s/data.json",
		lon: 0,
		lat: 0,
		
		// Timing
		updateInterval: 10 * 60 * 1000,	// every 10 minutes
		initialLoadDelay: 2500, 		// 2.5 seconds delay.
		retryDelay: 2500,

		units:		config.units,
		timeFormat:	config.timeFormat,
		lang:		config.language,

		// Visual configuration
		title:				"Weather Forecast",
		showWindDirection:	false,
		maxNumberOfDays:	5,
		fade:				true,
		fadePoint:			0.25, // Start on 1/4th of the list.
		animationSpeed:		1000, // 1 second
		
		// Mapping of SMHI Wsymb to an actual weather icon
		iconTable: {
			1: [	// SMHI: Clear sky
				"wi-day-sunny",
				"wi-night-clear"
			],			
			2: [	// SMHI: Nearly clear sky
				"wi-day-sunny-overcast",
				"wi-night-partly-cloudy"
			],
			3: [	// SMHI: Variable cloudness
				"wi-day-cloudy",
				"wi-night-alt-cloudy"
			],
			4: [	// SMHI: Halfclear sky
				"wi-day-cloudy",
				"wi-night-alt-cloudy"
			],
			5: [	// SMHI: Cloudy sky
				"wi-day-cloudy",
				"wi-night-alt-cloudy"
			],
			6: [	// SMHI: Overcast
				"wi-cloudy",
				"wi-cloudy"
			],
			7: [	// SMHI: Fog
				"wi-day-fog",
				"wi-night-fog"
			],
			8: [	// SMHI: Light rain showers
				"wi-day-showers",
				"wi-night-alt-showers"
			],
			9: [	// SMHI: Moderate rain showers
				"wi-day-showers",
				"wi-night-alt-showers"
			],
			10: [	// SMHI: Heavy rain showers
				"wi-day-showers",
				"wi-night-alt-showers"
			],
			11: [	// SMHI: Thunderstorm
				"wi-day-thunderstorm",
				"wi-night-alt-thunderstorm"
			],
			12: [	// SMHI: Light sleet showers
				"wi-day-sleet",
				"wi-night-alt-sleet"
			],
			13: [	// SMHI: Moderate sleet showers
				"wi-day-sleet",
				"wi-night-alt-sleet"
			],
			14: [	// SMHI: Heavy sleet showers
				"wi-day-sleet",
				"wi-night-alt-sleet"
			],
			15: [	// SMHI: Light snow showers
				"wi-day-snow",
				"wi-night-alt-snow"
			],
			16: [	// SMHI: Moderate snow showers
				"wi-day-snow",
				"wi-night-alt-snow"
			],
			17: [	// SMHI: Heavy snow showers
				"wi-day-snow",
				"wi-night-alt-snow"
			],
			18: [	// SMHI: Light rain
				"wi-day-rain",
				"wi-night-alt-rain"
			],
			19: [	// SMHI: Moderate rain
				"wi-day-rain",
				"wi-night-alt-rain"
			],
			20: [	// SMHI: Heavy rain
				"wi-day-rain",
				"wi-night-alt-rain"
			],
			21: [	// SMHI: Thunder
				"wi-day-lightning",
				"wi-night-alt-lightning"
			],
			22: [	// SMHI: Light sleet
				"wi-day-sleet",
				"wi-night-alt-sleet"
			],
			23: [	// SMHI: Moderate sleet
				"wi-day-sleet",
				"wi-night-alt-sleet"
			],
			24: [	// SMHI: Heavy sleet
				"wi-day-sleet",
				"wi-night-alt-sleet"
			],
			25: [	// SMHI: Light snowfall
				"wi-day-snow",
				"wi-night-alt-snow"
			],
			26: [	// SMHI: Moderate snowfall
				"wi-day-snow",
				"wi-night-alt-snow"
			],
			27: [	// SMHI: Heavy snowfall
				"wi-day-snow",
				"wi-night-alt-snow"
			]
		}
	},

	// Define required scripts.
	getScripts: function() {
		return [
			"moment.js"
		];
	},

	// Define required styles.
	getStyles: function() {
		return [
			"weather-icons.css",
			"weather-icons-wind.css",
			"MMM-Weather-SMHI.css"
		];
	},

	// Define required translations.
	getTranslations: function() {
		// The translations for the defaut modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionairy.
		// If you're trying to build yiur own module including translations, check out the documentation.
		return false;
	},

	// Define start sequence.
	start: function() {
		Log.info(
			"Starting module: " +
				this
					.name
		);

		// Set locale.
		moment.locale(
			config.language
		);

		this.forecast = [];
		this.hourlyForecast = [];
		this.current = null;
		this.loaded = false;
		this.scheduleUpdate(
			this
				.config
				.initialLoadDelay
		);

		this.updateTimer = null;
	},

	// Override dom generator.
	getDom: function() {

		// wrapper is the main container for this weather
		var wrapper = document.createElement(
			"div"
		);

		// check that lon & lat are configured,
		// and ask for configuration if not set
		if (
			this
				.config
				.lon ===
				"" ||
			this
				.config
				.lon ===
				0
		) {
			wrapper.innerHTML =
				"Please set the MMM-Weather-SMHI <i>lon</i> in the config for module: " +
				this
					.name +
				".";
			wrapper.className =
				"dimmed light small";
			return wrapper;
		}

		if (
			this
				.config
				.lat ===
				"" ||
			this
				.config
				.lat ===
				0
		) {
			wrapper.innerHTML =
				"Please set the MMM-Weather-SMHI <i>lat</i> in the config for module: " +
				this
					.name +
				".";
			wrapper.className =
				"dimmed light small";
			return wrapper;
		}

		// Display "LOADING" if not loaded yet
		if (
			!this
				.loaded
		) {
			wrapper.innerHTML = this.translate(
				"LOADING"
			);
			wrapper.className =
				"dimmed light small";
			return wrapper;
		}

		// Build CURRENT
		var current = document.createElement(
			"div"
		);
		current.className =
			"large light";
		
		// Build current wind information
		var wind = document.createElement(
			"span"
		);
		wind.className =
			"medium";

		// Add wind icon
		var windIcon = document.createElement(
			"span"
		);
		windIcon.className =
			"wi wi-strong-wind";
		wind.appendChild(
			windIcon
		);

		// get current wind speed w/o decimals
		var speed = parseFloat(
			this
				.current
				.wind
			).toFixed(
				0
			);

		// create and add the wind speed text, e.g. "5s "
		var windSpeed = document.createElement(
			"span"
		);
		windSpeed.innerHTML =
			" " +
			speed;
		var windSpeedMark = document.createElement(
			"sup"
		);
		windSpeedMark.innerHTML = "s ";
		wind.appendChild(
			windSpeed
		);
		wind.appendChild(
			windSpeedMark
		);

		// maybe add wind arrow
		if (
			this
				.config
				.showWindDirection
		) {
			var windDirection = document.createElement(
				"span"
			);
			windDirection.className =
				"wi wi-wind from-" +
					parseFloat(
						this
							.current
							.direction
					).toFixed(
						0
					) +
				"-deg";
			wind.appendChild(
				windDirection
			);
		}
		var spacer = document.createElement(
			"span"
		);
		spacer.innerHTML =
			"&nbsp;";
		wind.appendChild(
			spacer
		);
		
		current.appendChild(
			wind
		);

		var weatherIcon = document.createElement(
			"span"
		);
		weatherIcon.className =
			"bright wi w-icon-large " +
			this
				.current
				.icon;
		current.appendChild(
			weatherIcon
		);

		var temperature = document.createElement(
			"span"
		);
		temperature.className =
			"bright";
		temperature.innerHTML =
			" " +
			this
				.current
				.temp +
			"&deg;";
		current.appendChild(
			temperature
		);

		wrapper.appendChild(
			current
		);

		// FORECAST
		var table = document.createElement(
			"table"
		);
		table.className =
			"small";

		for (var f in this
			.forecast) {
			var forecast = this
				.forecast[
					f
				];

			// each forecast adds a row
			var row = document.createElement(
				"tr"
			);
			table.appendChild(
				row
			);

			// name of day
			var dayCell = document.createElement(
				"td"
			);
			dayCell.className =
				"day";
			dayCell.innerHTML =
				forecast[0].day;
			row.appendChild(
				dayCell
			);

			// max temp
			var maxTempCell = document.createElement(
				"td"
			);
			if (forecast[0].time.diff(moment()) >= 0) {
				maxTempCell.className =
					"align-right bright";
				maxTempCell.innerHTML =
					forecast[0]
						.temp +
					"&deg;";
			}
			else {
				maxTempCell.className =
					"align-right dimmed";
				maxTempCell.innerHTML = "";
			}
			row.appendChild(
				maxTempCell
			);

			// the day sky is...
			var iconCell = document.createElement(
				"td"
			);
			if (forecast[0].time.diff(moment()) >= 0) {
				iconCell.className =
					"bright w-icon-small";
				var icon = document.createElement(
					"span"
				);
				icon.className =
					"wi weathericon " +
					forecast[0]
						.icon;
				iconCell.appendChild(
					icon
				);
			}
			else {
				iconCell.className =
					"dimmed w-icon-small";
			}

			row.appendChild(
				iconCell
			);

			// min temp
			var minTempCell = document.createElement(
				"td"
			);
			minTempCell.innerHTML =
				forecast[1]
					.temp +
				"&deg;";
			minTempCell.className =
				"align-right";
			row.appendChild(
				minTempCell
			);

			// the night sky is...
			iconCell = document.createElement(
				"td"
			);
			iconCell.className =
				"w-icon-small";
			row.appendChild(
				iconCell
			);

			icon = document.createElement(
				"span"
			);
			icon.className =
				"wi weathericon " +
				forecast[1]
					.icon;
			iconCell.appendChild(
				icon
			);

			var windSpeedCell = document.createElement(
				"td"
			);
			windSpeedCell.className =
				"align-right";
			windSpeedCell.innerHTML =
				" " +
				parseFloat(
					forecast[0]
						.wind
				).toFixed(
					0
				)
			var windSpeedMark = document.createElement(
				"sup"
			);
			windSpeedMark.innerHTML = "s ";
			windSpeedCell.appendChild(
				windSpeedMark
			);
			row.appendChild(
				windSpeedCell
			);

			// possibly add wind arrow
			if (
				this
					.config
					.showWindDirection
			) {
				iconCell = document.createElement(
					"td"
				);
				iconCell.className =
					"w-icon-small";
				row.appendChild(
					iconCell
				);
				
				var windDirection = document.createElement(
					"span"
				);
				windDirection.className =
					"wi wi-wind from-" +
						parseFloat(
							forecast[0]
								.direction
						).toFixed(
							0
						) +
					"-deg dimmed";
				iconCell.appendChild(
					windDirection
				);
			}
			
			// add rain information
			var rainCell = document.createElement(
				"td"
			);

			var rainUnitMark = document.createElement(
				"span"
			);
			rainUnitMark.className = "mm-unit";
			rainUnitMark.innerHTML = "mm";

			rainCell.className =
				"align-right";
			rainCell.innerHTML =
				" " +
				parseFloat(
					forecast[1]
						.rainAcc
				).toFixed(
					1
				)
			rainCell.appendChild(
				rainUnitMark
			);
			row.appendChild(
				rainCell
			);
			

			if (
				this
					.config
					.fade &&
				this
					.config
					.fadePoint <
					1
			) {
				if (
					this
						.config
						.fadePoint <
					0
				) {
					this.config.fadePoint = 0;
				}
				var startingPoint =
					this
						.forecast
						.length *
					this
						.config
						.fadePoint;
				var steps =
					this
						.forecast
						.length -
					startingPoint;
				if (
					f >=
					startingPoint
				) {
					var currentStep =
						f -
						startingPoint;
					row.style.opacity =
						1 -
						1 /
							steps *
							currentStep;
				}
			}
		}

		var header = document.createElement(
			"header"
		);
		header.innerHTML = this.config.title;
		wrapper.appendChild(
			header
		);
		wrapper.appendChild(
			table
		);

		return wrapper;
	},

	// Get formated string, example
	// stringFormat("%s, %s and %s", ["Me", "myself", "I"]); // "Me, myself and I"
	stringFormat: function(
		theString,
		argumentArray
	) {
		var regex = /%s/;
		var _r = function(
			p,
			c
		) {
			return p.replace(
				regex,
				c
			);
		};
		return argumentArray.reduce(
			_r,
			theString
		);
	},

	/* updateWeather(compliments)
	 * Requests new data from openweather.org.
	 * Calls processWeather on succesfull response.
	 */
	updateWeather: function() {
 		var url = this.stringFormat(
			this
				.config
				.url,
			[
				this
					.config
					.lon
					.toFixed(4),
				this
					.config
					.lat
					.toFixed(4)
			]
		);
		var self = this;
		var retry = true;

		var weatherRequest = new XMLHttpRequest();
		weatherRequest.open(
			"GET",
			url,
			true
		);
		weatherRequest.onreadystatechange = function() {
			if (
				this
					.readyState ===
				4
			) {
				if (
					this
						.status ===
					200
				) {
					self.processWeather(
						JSON.parse(
							this
								.response
						)
					);
				} else if (
					this
						.status ===
					401
				) {
					self.config.appid =
						"";
					self.updateDom(
						self
							.config
							.animationSpeed
					);

					Log.error(
						self.name +
							": Load issue."
					);
					retry = false;
				} else {
					Log.error(
						self.name +
							": Could not load weather."
					);
				}

				if (
					retry
				) {
					self.scheduleUpdate(
						self.loaded
							? -1
							: self
								.config
								.retryDelay
					);
				}
			}
		};
		weatherRequest.send();
	},

	/* processWeather(data)
	 * Uses the received data to set the various values.
	 *
	 * argument data object - Weather information received form openweather.org.
	 */
	processWeather: function(
		data
	) {
		this.forecast = [];
		this.hourlyForecast = [];
		this.current = null;
		var closest = 50000;
		var day = null;
		var dayIndex = -1;
		var rainAcc = 0;

		for (
			var i = 0,
				count =
					data
						.timeSeries
						.length;
			i <
			count;
			i++
		) {
			
			// one row of the forecast
			var forecast =
				data
					.timeSeries[
						i
					];
					
			// extract details for this row
			var item = {
				time: moment(
					forecast.validTime
				),
				day: moment(
					moment(
						forecast.validTime
					),
					"X"
				).format(
					"ddd"
				),
				icon: this.processWeatherGetItem(
					"Wsymb2",
					forecast
				),
				temp: parseFloat(	// temperature without decimals
					this.processWeatherGetItem(
						"t",
						forecast
					).toFixed(
						0
					)
				),
				wind: this.processWeatherGetItem(
					"ws",
					forecast
				),
				direction: this.processWeatherGetItem(
					"wd",
					forecast
				),
				rain: this.processWeatherGetItem(
					"pmean",
					forecast
				)
			};

			// enough parsed? then break!
			if (
				item.time.diff(
					moment().endOf('day'),
					"days"
				) >=
				this
					.config
					.maxNumberOfDays
			) {
				break;
			}

			// Item belongs to new day?
			if (
				item.day !=
				day
			) {
				day =
					item.day;
				dayIndex++;
				rainAcc = 0;
			}

			// Accumulate daily rain
			rainAcc =
				rainAcc +
				parseFloat(
					item.rain
				);
			
			if (
				this
					.forecast[
						dayIndex
					] ==
				null
			) {
				this.forecast[
					dayIndex
				] = [];
			}

			var hoursFromNow = 
				item.time.diff(
					moment(),
					"hours"
				)
				
			if (hoursFromNow >= 0 && hoursFromNow < 24) {
				this.hourlyForecast[hoursFromNow] = item;
			}
			
			// Save current (closest to clock)
			var timeFromNow = Math.abs(
				item.time.diff(
					moment(),
					"minutes"
				)
			);
			if (
				timeFromNow <
				closest
			) {
				closest = timeFromNow;
				this.current = item;
			}

			// Save forecast
			var timeFormat = item.time.format(
				"YYYY-MM-DD"
			);
			var timeDay = moment(
				timeFormat +
					" 12:00",
				"YYYY-MM-DD HH:mm"
			);
			var timeNight = moment(
				timeFormat +
					" 23:59",
				"YYYY-MM-DD HH:mm"
			);
			var timeFromNowDay = Math.abs(
				item.time.diff(
					timeDay,
					"minutes"
				)
			);
			var timeFromNowNight = Math.abs(
				item.time.diff(
					timeNight,
					"minutes"
				)
			);

			// set first
			if (
				this
					.forecast[
						dayIndex
					][0] ==
				null
			) {
				this.forecast[
					dayIndex
				][0] = this.processWeatherCreateItem(
					0,
					item,
					rainAcc,
					timeFromNowDay
				);
				this.forecast[
					dayIndex
				][1] = this.processWeatherCreateItem(
					1,
					item,
					rainAcc,
					timeFromNowNight
				);
			} else {
				if (
					timeFromNowDay <
					this
						.forecast[
							dayIndex
						][0]
						.diff
				) {
					this.forecast[
						dayIndex
					][0] = this.processWeatherCreateItem(
						0,
						item,
						rainAcc,
						timeFromNowDay
					);
				} else if (
					timeFromNowNight <
					this
						.forecast[
							dayIndex
						][1]
						.diff
				) {
					this.forecast[
						dayIndex
					][1] = this.processWeatherCreateItem(
						1,
						item,
						rainAcc,
						timeFromNowNight
					);
				}
			}
		}

//		Log.log(this.forecast);

		this.loaded = true;
		this.updateDom(
			this
				.config
				.animationSpeed
		);
	},

	processWeatherGetItem(
		id,
		data
	) {
		for (
			var i = 0,
				count =
					data
						.parameters
						.length;
			i <
			count;
			i++
		) {
			var param =
				data
					.parameters[
						i
					];
			if (
				param.name ===
				id
			) {
				return param
					.values[0];
			}
		}
		return null;
	},

	processWeatherCreateItem(
		index,
		item,
		rainAcc,
		diff
	) {
		item.diff = diff;
		if (
			!isNaN(
				item.icon
			)
		) {
			item.icon = this.config.iconTable[
				item.icon
			][
				index
			];
		}
		
		item.rainAcc = rainAcc;
		
		return item;
	},

	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(
		delay
	) {
		var nextLoad = this
			.config
			.updateInterval;
		if (
			typeof delay !==
				"undefined" &&
			delay >=
				0
		) {
			nextLoad = delay;
		}

		var self = this;
		clearTimeout(
			this
				.updateTimer
		);
		this.updateTimer = setTimeout(
			function() {
				self.updateWeather();
			},
			nextLoad
		);
	},
});
