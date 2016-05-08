/* jshint -W097 */// jshint strict:false
/*jslint node: true */

"use strict";
var utils       = require(__dirname + '/lib/utils'); // Get common adapter utils
var parseString = require('xml2js').parseString;
var request     = require('request');
var logging     = true;
var lang = 'de';

var adapter = utils.adapter({
    name:           'tvspielfilm',
    systemConfig:   true,
    useFormatDate:  true
});

adapter.on('ready', function () {
    adapter.getForeignObject('system.config', function (err, data) {
        if (data && data.common) {
            lang  = data.common.language;
        }

        adapter.log.debug('adapter tvspielfilm initializing objects');
        main();
        adapter.log.info('adapter tvspielfilm objects written');

        setTimeout(function () {
            adapter.log.info('force terminating after 1 minute');
            adapter.stop();
        }, 60000);

    });
});

function readSettings() {
    if (adapter.config.blacklist === undefined || adapter.config.blacklist.length === 0) adapter.log.info('Keine Stationen zur Blacklist hinzugefügt');
    else if (logging) adapter.log.info('Zahl Stationen in Blacklist: ' + adapter.config.blacklist.length);
    // eigentlich wird erst in check_sender das setting (config.blacklist) eingelesen
    
    for (var s in adapter.config.blacklist) {
        if (logging) adapter.log.info('Blacklist (#' + (parseInt(s,10)+1) + '): ' + adapter.config.blacklist[s]);
    }
} 


function check_sender (show) { //  wird so übergeben "16:50 | Sky Cinema | Kill the Boss 2"
    var show_info = show.split(' | ');
    
    // es können noch weitere Daten extrahiert und geprüft werden:
    // showtime_info = show_info[0].split(':');
    // showtime = new Date ();
    // showtime.setHours(parseInt(showtime_info[0],10));   // -> 16
    // showtime.setMinutes(parseInt(showtime_info[1],10)); // -> 50
    // Vergleich mit aktueller zeit möglich....
    
    // Suche nach Filmen genauso möglich
    // movie = show_info[2];
    
    // Suche nach Sender
    var station = show_info[1];
    var station_in_blacklist = (adapter.config.blacklist.indexOf(station,0) == -1) ? true : false; // Sender nicht in der Blacklist, also empfangbar
    return(station_in_blacklist); 
}


var rss_options = {
    jetzt :        { feedname: 'Jetzt',
                     url: 'http://www.tvspielfilm.de/tv-programm/rss/jetzt.xml',
                     state: 'rss.jetzt',
                     cssclass:  'tv_jetzt'
                   },
    tipps:         { feedname: 'Tipps',
                     url: 'http://www.tvspielfilm.de/tv-programm/rss/tipps.xml',
                     state: 'rss.tipps',
                     cssclass:  'tv_tipps'
                    },
    heute2015uhr:  { feedname: 'heute 20:15 Uhr',
                     url: 'http://www.tvspielfilm.de/tv-programm/rss/heute2015.xml',
                     state: 'rss.heute2015uhr',
                     cssclass:  'tv_heute2015'
                    },
    heute2200uhr:  { feedname: 'heute 22:00 Uhr',
                     url: 'http://www.tvspielfilm.de/tv-programm/rss/heute2200.xml',
                     state: 'rss.heute2200uhr',
                     cssclass:  'tv_heute2200'
                    },
    filme:          { feedname: 'Spielfilm-Highlights des Tages',
                     url: 'http://www.tvspielfilm.de/tv-programm/rss/filme.xml',
                     state: 'rss.filme',
                     cssclass:  'tv_filme'
                    }
}


function readFeed (x) {
    var link = rss_options[x].url;
    adapter.log.info('RSS Feed wird eingelesen: ' + link);
    request(link, function (error, response, body) {
        if (!error && response.statusCode == 200) {
    
            parseString(body, {
                explicitArray: false,
                mergeAttrs: true
            }, function (err, result) {
                var data = JSON.stringify(result, null, 2);
                var table = [];
                if (err) {
                    adapter.log.warn("Fehler: " + err);
                } else {                                                               
                    var sender_empfangbar = false;
                    if (result.rss.channel.item.length !== null) { // gelegentlicher Fehler bei nächtlicher Abfrage durch length (undefined) soll hier abgefangen werden
                        // Array durchzaehlen von 0 bis Zahl der items
                        for(var i = 0; i < result.rss.channel.item.length; i++) {
                            sender_empfangbar = check_sender(result.rss.channel.item[i].title);
                            if (sender_empfangbar) {
                                var entry = {
                                    image: result.rss.channel.item[i].enclosure ? '<img width="100%" src="' + result.rss.channel.item[i].enclosure.url + '" />' : '',
                                    text:  '<table class="' + rss_options[x].cssclass + '"><tr><td class="' + rss_options[x].cssclass + '_text" style="text-align: left; padding-left: 5px; font-weight: bold"><a href="' +
                                       result.rss.channel.item[i].link + '" target="_blank">' + result.rss.channel.item[i].title +
                                       '</a></td></tr><tr><td style="text-align: left; padding-left: 5px">' +
                                       result.rss.channel.item[i].description +'</td></tr></table>',
                                    _Bild: result.rss.channel.item[i].enclosure ? '<img class="' + rss_options[x].cssclass + '_bild" width="100%" src="' + result.rss.channel.item[i].enclosure.url + '" />' : 'no image'
                                };
                                table.push(entry);
                            } // Ende Abfrage, ob Sender empfangbar
                        }
                    } else adapter.log.warn('LENGTH in TV Programm (' + rss_options[x].feedname + ') nicht definiert'); // ende if ungleich
                }
                adapter.setState(rss_options[x].state, {val: JSON.stringify(table), ack: true});// ganze XML in Objekt für Table Widget
            });
        } else adapter.log.warn(error,'error');
    });   // Ende request 
    if (logging) adapter.log.info('XML-Daten aus TV Spielfilm (' + rss_options[x].feedname + ') eingelesen');
}
function main() {
    readSettings();
    for (var j in rss_options) {
        readFeed(j);
    }
    //adapter.stop();
}
