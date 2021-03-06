// Port allocation
var gui = require('nw.gui');
var lodash = require('lodash');
var qClass = require('qpatch').qClass;
var harbor = qClass(require('harbor'));
var ports = new harbor(19000, 20000);

// Local requires
var codebox = require('../index.js');

var win = gui.Window.get();

var startCodebox = function(path) {
    console.log("start ide in ", path);

    // Claim port
    return ports.claim(path)
    .then(function(port) {
        // Setup url
        var url = "http://localhost:"+port;
        return [port, url];
    })
    .spread(function (port, url) {
        return codebox.start({
            'root': path,
            'server': {
                'port': port
            },
            'addons': {
                'blacklist': ["cb.offline"]
            }
        })
        .then(function(box) {
            return url+"?_t="+Date.now();
        });
    })
    .then(function(url) {
        $("body").append("<iframe src='"+url+"' nwdisable nwfaketop></iframe>");
    });
};

var queryString = function () {
    // This function is anonymous, is executed immediately and
    // the return value is assigned to QueryString!
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=").map(decodeURIComponent);
        // If first entry with this name
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = pair[1];
        // If second entry with this name
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [ query_string[pair[0]], pair[1] ];
            query_string[pair[0]] = arr;
        // If third or later entry with this name
        } else {
            query_string[pair[0]].push(pair[1]);
        }
    }
    return query_string;
};

window.onload = function() {
    win.show();
    win.focus();

    var qs = queryString();

    var path = qs.path;
    if (!qs.path) {
        return win.close();
    }

    var env = qs.env ? JSON.parse(qs.env) : null;
    // Merge environment variables sent from manager
    if(env) {
        process.env = lodash.extend({}, process.env, env);
    }
    startCodebox(path).fail(function() {
        win.close();
    });
};