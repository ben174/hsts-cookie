# hsts-cookie
Creates a HSTS Supercookie to fingerprint a browser

This is a proof of concept self-hosted application which will lay a "super cookie"
using the HSTS web standard. 

Created by Ben Friedland
http://www.bugben.com

## How it works

HTTP Strict Transport Security (HSTS) is a web security standard implemented 
by browsers via a Response header which instructs the browser to send subsequent 
requests to this particular URL over HTTPS, even if the original request was made
using HTTP. When a browser receives a HSTS instruction, that instruction is retained
no matter what. *Even if you go incognito or private.*

## How I implemented it

It's actually kind of simple. On the first request to the page, a random 24 bit number is generated
by the client. 

Let's say the number is 8396804 this will be your fingerprint.

I then convert this number into binary:

    100000000010000000000100

And then map these bits as flags, to request several URLs which are served with the HSTS header. Since
this example has 1's in the positions of 0, 10 and 22, I'd request three URLs:

    https://w00.example.com
    https://w10.example.com
    https://w22.example.com

I can now guarantee that subsequent visits to the http version of this URL will be redirected to https.

On the next request, I instruct the client to visit all 24 URLs.

    // simplified for clarity
    for(var i=0;i<24;i++) {                                                 
        var url = 'http://' + i + '.example.com/h.gif';     
        bitArray[i] = hsts.httpGet(url)   // returns true if the request was a redirect
    }
        
I then reconstruct that bit array into a number again, and bam - I've retrieved your fingerprint.

## Where it works

Chrome - very reliable. Works when switching to incognito or even across profiles.

Firefox - Not super reliable, doesn't transfer to incognito.

Safari - Especially scary - since the HSTS information is actually persisted to your iCloud device
and therefore is *retained across devices*.

IE/Edge - Dunno, please contact me or create an issue if you know.
