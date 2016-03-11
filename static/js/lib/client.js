// Source https://stackoverflow.com/questions/247483/http-get-request-in-javascript

var HttpClient = function() { // this is a constructor

    this.get = function (url) {
        return new Promise((resolve, reject) => {
            
            var request = new XMLHttpRequest();
            
            // Open an get request
            request.open('GET', url);

            // If the request is done
            request.onload = function() {
                
                // Only if request is done
                if (request.status == 200) {                
                    
                    // Send text form request
                    resolve(request.responseText);

                } else {
                    // Reject the promise if there is a err
                    reject(new Error('Request failed!'));
                }
            };    

            // Send the request
            request.send();
        });
    }
}