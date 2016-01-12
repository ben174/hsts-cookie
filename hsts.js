"use strict";
/*jslint browser: true, regexp: true*/
var hsts = {
    token: null,
    tokenHex: null,
    tokenBin: null,
    tokenArray: [],
    hostname: '[HOSTNAME]',
    doTest: true,
    i: 0,

    init: function () {
        // drop a test token to see if they've been here before
        hsts.httpGet('http://wts.' + hsts.hostname + '/h.gif');
    },

    generateToken: function () {
        // generate a random token on their first visit
        hsts.token = Math.floor(Math.random() * 16777215);
        hsts.tokenBin = (new Array(24).join("0") + hsts.token.toString(2)).slice(-24);
        hsts.tokenHex = hsts.token.toString(16);
        hsts.printTokens();
    },

    dropTokens: function () {
        var i = 0,
            b = null,
            fullhost = null;
        console.log("First visit. Dropping tokens.");
        // request the test token as https so we can test whether their
        // next visit is a return - we will read the tokens on their next visit
        hsts.doTest = false;
        hsts.httpGet('https://wts.' + hsts.hostname + '/h.gif');

        // now drop a unique set of individual tokens as https
        for (i = 0; i < hsts.tokenBin.length; i += 1) {
            b = hsts.tokenBin.charAt(i);
            if (b === '1') {
                fullhost = 'w' + (i < 10 ? "0" + i : i) + '.' + hsts.hostname;
                hsts.httpGet('https://' + fullhost + '/h.gif');
            }
        }
    },

    readTokens: function () {
        var i = 0,
            padded = null,
            url = null;
        console.log("Return visit. Retrieving tokens.");
        // drop 24 tokens as http so we can determine which were redirected
        for (i = 0; i < 24; i += 1) {
            padded = (i < 10 ? "0" + i : i);
            url = 'http://w' + padded + '.' + hsts.hostname + '/h.gif';
            hsts.httpGet(url);
        }
    },

    parseTokenArray: function () {
        console.log("Parsing token array.");
        hsts.tokenBin = hsts.tokenArray.join('');
        hsts.token = parseInt(hsts.tokenBin, 2);
        hsts.tokenHex = hsts.token.toString(16);
        hsts.printTokens();
    },

    printTokens: function () {
        console.log(hsts.tokenBin);
        console.log(hsts.tokenBin);
        console.log(hsts.tokenHex);
    },

    httpGet: function (url) {
        var xmlHttp = new XMLHttpRequest(),
            bit = null,
            doParse = null,
            i = 0;
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                var sub = xmlHttp.responseURL.match(/\/\/w(.*?)\./)[1],
                    isHttps = xmlHttp.responseURL.charAt(4) === 's';
                if (sub === 'ts') {
                    // this is the test token
                    if (!hsts.doTest) {
                        // this is the initial flag set, don't act on it
                        return;
                    }
                    if (isHttps) {
                        // the test token came in as https, so they're returning
                        hsts.readTokens();
                    } else {
                        // seems they've never been here before, drop a token
                        hsts.generateToken();
                        hsts.dropTokens();
                    }
                } else {
                    // this is a bit token
                    bit = parseInt(sub, 10);
                    hsts.tokenArray[bit] = isHttps ? 1 : 0;
                    // check if token array is full, if so parse the array
                    doParse = true;
                    for (i = 0; i < 24; i += 1) {
                        if (hsts.tokenArray[i] === undefined) {
                            doParse = false;
                        }
                    }
                    if (doParse) {
                        hsts.parseTokenArray();
                    }
                }
            }
        };
        xmlHttp.open("GET", url, true);
        xmlHttp.send(null);
    },
};

hsts.init();
