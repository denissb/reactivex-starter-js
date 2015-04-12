var request = require('superagent');
var Rx = require('rx');

//Hardcode
var clientId = 'a85622eade3a4986b6474847851871c8';

var participant = 'anonymous';
var interval = 5; // seconds
var postEndpoint = 'http://rxdisplay.neueda.lv/in';
var instagramTag = encodeURIComponent('Riga');


// Step 0: Helper to create Observable instances from HTTP requests
Rx.Observable.fromRequest = function(req) {
  return Rx.Observable.create(function(observable) {
    req.end(function(err, res) {
      if (err) {
        observable.onError(err);
      } else {
        observable.onNext(res);
      }
      observable.onCompleted();
    })
  });
};

// Step 1: Fetch from Instagram by tag
var apiRoot = 'https://api.instagram.com/v1/';
var fromInstagramByTag = function(tag) {
  if (!arguments[0]) {
    throw new Error('Please provide a tag!');
  }

  var url = apiRoot + 'tags/' + tag + '/media/recent?client_id=' + clientId + '&count=10';
  return Rx.Observable.fromRequest(request.get(url));
};

// Step 2: Fetch with an interval and flatten
var ticker = Rx.Observable.interval(interval * 1000).timeInterval();
var rawPics = ticker.flatMap(function() {
  return fromInstagramByTag(instagramTag).flatMap(function(res) {
    return res.body.data;
  });
});

// Step 3: Filter and restructure data, then send to UI
var uniquePics = rawPics.distinct(function (pic) {
    return pic.id;
}).filter(function (x) {
    return x.location != null;
});

var pics = uniquePics.map(function(pic) {
  return {
    tag: instagramTag,
    url: pic.images.thumbnail.url,
    location: pic.images.location,
    participant: "DB"
  };
});

pics.subscribe(function(pic) {
  var req = request.post(postEndpoint).send(pic);
  Rx.Observable.fromRequest(req)
    .subscribe(function(res) {
      console.log(postEndpoint + ' <- ' + pic.url);
    }, function(err) {
      if (err.response) {
        console.log(err.response.text.trim());
      } else {
        console.log(err.code);
      }
    });
});*/