/******************
	UTILITIES
*******************/

APP.utils = (function () {

    function getRandomSize(min, max) {
        return Math.round(Math.random() * (max - min) + min);
    };


    // Source: http://jamesallardice.com/how-to-check-if-a-javascript-object-has-a-certain-value/

    function hasValue(obj, key, value) {
        return obj.hasOwnProperty(key) && obj[key] === value;
    };

    return {
        getRandomSize: getRandomSize,
        hasValue: hasValue
	};

})();