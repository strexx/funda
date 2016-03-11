/******************
	GET data
*******************/

APP.get = (function () {

    // Zoek API van Funda
    
	var settings = {
        "apiKey": "e2d60e885b8742d4b0648300e3703bd7",
        "url": "http://funda.kyrandia.nl/feeds/Aanbod.svc/json/",
        "filters": "/?type=koop&pagesize=",
        "pagesize": 25,
        "fullUrl": function() {
            return this.url + this.apiKey + this.filters + this.pagesize;
        }   
    };

    function url() {
    	return settings.fullUrl();
    };

    function locale() {
        var huizen = ['huizen'];
        huizen.forEach(function (currentValue, index) {
            var getCurrent = localStorage.getItem(currentValue);
            if (getCurrent === null || getCurrent === undefined) {
                localStorage.setItem(currentValue, '[]');
            }
        });            
    };

 	function data(url) {
        return new Promise((resolve, reject) => {
            var request = new XMLHttpRequest();
            
            request.open('GET', url);

            request.onload = function () {
                if (request.status == 200) {
                    resolve(request.responseText);
                } else {
                    reject(new Error('Error: request failed'));
                }
            };
            request.send();
        });
    };

	function localData() {
		return JSON.parse(localStorage.getItem('data')); 	
	};

	return {
        data: data,
        url: url,
        locale: locale,
        localData: localData
	};

})();