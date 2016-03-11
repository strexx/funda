/******************
 Render templates
*******************/

APP.render = (function() {

    var _housesVisited = [],
        _houseDetailObjects = [],
        _url = APP.get.url(),
        _template = new HttpClient(),
        _main = document.querySelector('main'),
        _body = document.querySelector('body'),
        _localData = APP.get.localData();

    function home() {

        var objectsArr = [];

        var dataTest = APP.get.data(_url);

        if (_localData) {

            // Loop through dataset
            _localData.Objects.forEach(function(object) {
                var objects = {
                    id: object.Id,
                    foto: object.Foto,
                    fotoMedium: object.FotoMedium,
                    fotoLarge: object.FotoLarge,
                    fotoLargest: object.FotoLargest,
                    width: APP.utils.getRandomSize(200, 400),
                    height: APP.utils.getRandomSize(200, 400),
                    price: object.Prijs.Koopprijs,
                    address: object.Adres,
                    city: object.Woonplaats
                };
                objectsArr.push(objects);
            });

            // Render template
            _template.get('./static/templates/home.mst')
                .then(response => {
                    _main.innerHTML = Mustache.render(response, {
                        "objects": objectsArr,
                        "headTitle": "Bekijk de nieuwste huizen die te koop staan.."
                    });
                })
                .catch(e => {
                    console.error(e);
                });

        } else {

            APP.get.data(_url)
                .then(response => {

                    localStorage.setItem('data', response);

                    // Data to json
                    var data = APP.get.localData();

                    // Loop through dataset
                    data.Objects.forEach(function(object) {
                        var objects = {
                            id: object.Id,
                            foto: object.Foto,
                            fotoMedium: object.FotoMedium,
                            fotoLarge: object.FotoLarge,
                            fotoLargest: object.FotoLargest,
                            width: APP.utils.getRandomSize(200, 400),
                            height: APP.utils.getRandomSize(200, 400),
                            price: object.Prijs.Koopprijs,
                            address: object.Adres,
                            city: object.Woonplaats,
                            postcode: object.Postcode
                        };
                        objectsArr.push(objects);
                    });

                    // Render template
                    _template.get('./static/templates/home.mst')
                        .then(response => {
                            _main.innerHTML = Mustache.render(response, {
                                "objects": objectsArr,
                                "headTitle": "Bekijk de nieuwste huizen die te koop staan"
                            });
                        })
                        .catch(e => {
                            console.error(e);
                        });
                })
                .catch(e => {
                    console.error(e);
                });
        }
    };

    function huis(id) {

        var objectsArr = [],
            comparisonObject = [],
            filters = {
                AantalKamers: 6,
                Woonplaats: "Hoogvliet Rotterdam"
            },
            housesVisitedNumber = 3,
            houseId = id,
            house = _.filter(_localData.Objects, function(item) {
                return item.Id == houseId;
            }),
            huisObject = house[0],
            houseDetailObjects = [];

        APP.get.data('http://funda.kyrandia.nl/feeds/Aanbod.svc/json/detail/e2d60e885b8742d4b0648300e3703bd7/koop/' + houseId)
            .then(response => {

                // Check of er meer dan 5 huizen bezocht zijn

                if (_housesVisited.length < housesVisitedNumber && !_.contains(_housesVisited, huisObject.Id)) {
                    _housesVisited.push(huisObject.Id);
                } else {

                    // Gooi objecten van huizen die zijn bezocht in een nieuwe array

                    var houseObjects = [];
                    _.forEach(_housesVisited, function(id) {
                        _.some(_localData.Objects, function(house) {
                            if (house.Id === id) {
                                houseObjects.push(house);
                                return true;
                            }
                        });
                    });

                    // Bekijk voor elk huis of er gelijkenissen zijn

                    _.forEach(houseObjects, function(house) {
                        var houseWithResemblance = _.every(filters, function(value, key) {
                            if (typeof value === 'string') {
                                return house[key] === value;
                            }
                            if (typeof value === 'number') {
                                return house[key] === value;
                            }
                        });
                        if (houseWithResemblance) comparisonObject.push(house);
                    });
                }

                // Als er meer dan 2 overeenkomsten zijn render dan een nieuwe pagina
                // Met data

                if (comparisonObject.length > 1) {

                    var newData = _.filter(_localData.Objects, function(item) {
                        return item.Woonplaats == filters.Woonplaats && item.AantalKamers == filters.AantalKamers;
                    });

                    var objectsArr = [];
                        comparisonObject = [];

                    // Loop through dataset
                    newData.forEach(function(object) {
                        var objects = {
                            id: object.Id,
                            foto: object.Foto,
                            fotoMedium: object.FotoMedium,
                            fotoLarge: object.FotoLarge,
                            fotoLargest: object.FotoLargest,
                            width: APP.utils.getRandomSize(200, 400),
                            height: APP.utils.getRandomSize(200, 400),
                            price: object.Prijs.Koopprijs,
                            address: object.Adres,
                            city: object.Woonplaats,
                            postcode: object.Postcode
                        };
                        objectsArr.push(objects);
                    });

                    // Render template
                    _template.get('./static/templates/modal.mst')
                        .then(response => {
                            _main.innerHTML += Mustache.render(response);

                            var bekijkBtn = document.querySelector("#bekijkBtn"),
                                closeBtn = document.querySelector("#closeBtn");

                            closeBtn.addEventListener('click', function() {
                                var overlay = document.querySelector("#overlay");
                                overlay.classList.add("hidden");
                                window.location.hash = "#huis/" + houseId;
                            });

                            bekijkBtn.addEventListener('click', function() {
                                _template.get('./static/templates/home.mst')
                                    .then(response => {
                                        _main.innerHTML = Mustache.render(response, {
                                            "objects": objectsArr,
                                            "headTitle": "Omdat je huizen in " + filters.Woonplaats + " met " + filters.AantalKamers + " kamers interessant vindt.."
                                        });
                                    })
                                    .catch(e => {
                                        console.error(e);
                                    }); 
                            });                            
                        })
                        .catch(e => {
                            console.error(e);
                        });
                } else {
                    var data = JSON.parse(response);
                    _houseDetailObjects.push(data);

                    // Render template
                    _template.get('./static/templates/huis.mst')
                        .then(response => {
                            _main.innerHTML = Mustache.render(response, {
                                "huis": data,
                                "media": {
                                    foto: data.Media[1].MediaItems[2].Url,
                                    foto2: data.Media[2].MediaItems[2].Url,
                                    foto3: data.Media[4].MediaItems[2].Url,
                                    foto4: data.Media[5].MediaItems[2].Url,
                                }
                            });                            
                        })
                        .catch(e => {
                            console.error(e);
                        });
                }
            })
            .catch(e => {
                console.error(e);
            });
    };

    /* 404 page */

    function error() {

        _template.get('./static/templates/404.mst')
            .then(response => {
                _body.innerHTML = Mustache.render(response);
            })
            .catch(e => {
                console.error(e);
            });
    };

    return {
        home: home,
        huis: huis,
        error: error
    };

})();
