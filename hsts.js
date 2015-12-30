var hsts = {
    token: null,
    tokenHex: null,
    tokenBin: null,
    tokenArray: [],
    hostname: '[HOSTNAME]',
    doTest: true,

    init: function() {
        // drop a test token to see if they've been here before
        hsts.httpGet('http://www.' + hsts.hostname + '/h.gif');
    },

    generateToken: function() {
        // generate a random token on their first visit
        hsts.token = Math.floor(Math.random()*16777215);
        hsts.tokenBin = hsts.token.toString(2);
        hsts.tokenHex = hsts.token.toString(16);
        console.log(hsts.token);
        console.log(hsts.tokenBin);
        console.log(hsts.tokenHex);
    },

    dropTokens: function() {
        console.log("First visit. Dropping tokens.");
        // request the test token as https so we can test whether their
        // next visit is a return - we will read the tokens on their next visit
        hsts.doTest = false;
        hsts.httpGet('https://www.' + hostname + '/h.gif');

        // now drop a unique set of individual tokens as https
        for(var i=0;i<hsts.tokenBin.length;i++) {
            var b = hsts.tokenBin.charAt(i);
            if(b == '1') {
                var fullhost = 'w' + (i<10?"0"+i:i) + '.' + hsts.hostname;
                hsts.httpGet('https://' + fullhost + '/h.gif');
            }
        }
    },

    readTokens: function() {
        console.log("Return visit. Retrieving tokens.");
        // drop 24 tokens as http so we can determine which were redirected
        for(var i=0;i<24;i++) {
            var padded = (i<10?"0"+i:i);
            hsts.httpGet('http://w' + padded + '.' + hsts.hostname + '/h.gif');
        }

    },

    httpGet: function(url) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                console.log(xmlHttp.responseURL);
                var sub = xmlHttp.responseURL.match(/\/\/w(.*?)\./)[1];
                var isHttps = xmlHttp.responseURL.charAt('4') == 's';
                if(sub == 'ww') {
                    // this is the test token
                    if(!hsts.doTest) {
                        // this is the initial flag set, don't act on it
                        return;
                    }
                    if(isHttps) {
                        // the test token came in as https, so they're returning
                        hsts.generateToken();
                        hsts.dropTokens();
                    } else {
                        // seems they've never been here before, drop a token
                        hsts.readTokens();

                    }
                } else {
                    // this is a bit token
                    var bit = parseInt(sub);
                    hsts.tokenArray[bit] = isHttps;
                    // check if token array is full, if so - return value
                }
            }
        }
        xmlHttp.open("GET", url, true);
        xmlHttp.send(null);
    },
};
hsts.init();
