/******************
 Local storage
*******************/

APP.MyLocalStorage = (function () {

    function getItem(key) {
        return new items(JSON.parse(localStorage.getItem(key)));
    };

    function setItem(key, object) {
        localStorage.setItem(key, JSON.stringify(object));
        return this.getItem(key);
    };

    function items(object, key) {
        this.item = object;
        this.key = key;
        this.addSubItem = function(subItem) {
            if (typeof this.item.push == 'function') {
                this.item.push(subItem);
                this.save();
                return this;
            }
            return false;
        };
        this.setItem = function(object) {
            this.item = object;
            this.save();
            return this;
        };
        this.save = function() {
            APP.MyLocalStorage.setItem(this.key, this.item);
        };
        this.toString = function() {
            return this.item.toString();
        }
    }

    return {
        getItem: getItem,
        setItem: setItem,
        items: items
    };

})();