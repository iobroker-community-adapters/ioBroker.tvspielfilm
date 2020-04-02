/* jshint -W097 */// jshint strict:false
/*jslint node: true */

"use strict";
var utils = require('@iobroker/adapter-core'); // Get common adapter utils
var parseString = require('xml2js').parseString;
var request = require('request');
var lang = 'de';

const adapter = utils.Adapter({
    name: 'tvspielfilm',
    systemConfig: true,
    useFormatDate: true
});

adapter.on('ready', main);

adapter.on('stateChange', (id, state) => {
    if (state && !state.ack) {
        if (id === adapter.namespace + '.search.list') { // derzeit nur Suchbegriffe - Datenpunkt
            /*if (typeof state.val !== 'string') {
                if (state.val === null || state.val === undefined || state.val === '') {
                    adapter.log.warn('Datenpunkt leer');
                    return;
                }
                state.val = state.val.toString();
            }*/
            adapter.log.info("Suchbegriffe geändert");
            main();
        }
    }
});


let matches = 0;
let string_found_css = " style=\"border: 2px solid yellow; background-color: rgba(150,0,0,0.9); background-color: darkred;\""; // Style für Table bei Treffer
let searchStringPattern = ""; // zuerst leere Zeichenkette
let searchString_arr = []; //["Tatort", "Krimi", "Mord", "Verbrechen"]; // <-- kommt aus Datenpunkt als Array

function searchStringCheck() {
    adapter.getState("search.list", function (err, obj) {
        if (!err) {
            if (!obj) {
                adapter.log.debug("keine Suchbegriffe gefunden, Datenpunkt leer oder nicht angelegt");
            } else {
                //if (searchString_arr === undefined || searchString_arr.length === 0) { // leer
                //    adapter.log.debug("keine Suchbegriffe festgelegt");
                //} else { // Suchbegriffe gefunden
                searchString_arr = obj.val.split(","); // aus CSV ein Array machen
                searchString_arr = searchString_arr.sort(); // alphabetisch sortieren

                for (let rm = searchString_arr.length - 1; rm >= 0; rm--) { // Leerzeichen und leere Einträge löschen
                    searchString_arr[rm] = searchString_arr[rm].trim();
                    if (!searchString_arr[rm]) searchString_arr.splice(rm, 1);
                }

                // Aus Suchbegriffen ein Pattern bauen
                adapter.log.debug("Anzahl der Suchbegriffe: " + searchString_arr.length);
                // Präpariertes Array in Datenpunkt schreiben
                adapter.setState("search.list", { val: searchString_arr.toString(), ack: true });
                // RegExp erstellen
                searchStringPattern = ""; // Suchmuster zuerst leer
                for (let s = 0; s < searchString_arr.length; s++) { // dann mit Begriffen auffüllen
                    adapter.log.debug('Suchbegriff (#' + (parseInt(s, 10) + 1) + '): ' + searchString_arr[s]);
                    searchStringPattern += searchString_arr[s] + (s < searchString_arr.length - 1 ? "|" : "");
                }
                searchStringPattern = new RegExp(searchStringPattern, "gi"); // und schließlich ein Regulären Ausdruck zusammensetzen
                adapter.log.debug("Suchmuster: " + searchStringPattern.source);

                adapter.log.debug("Suchmuster erstellt");
                //} // Ende else Suchbegriffe gefunden
            } // Ende else !obj
        } else {
            adapter.log.warn("Fehler beim Einlesen der Suchbegriffe");
        }
    });
}

function readSettings() {

    //Blacklist
    if (adapter.config.blacklist === undefined || adapter.config.blacklist.length === 0) adapter.log.debug('Keine Stationen zur Blacklist hinzugefügt');
    else adapter.log.debug('Zahl Stationen in Blacklist: ' + adapter.config.blacklist.length);
    for (var bl in adapter.config.blacklist) {
        adapter.log.debug('Blacklist (#' + (parseInt(bl, 10) + 1) + '): ' + adapter.config.blacklist[bl]);
    }
    //Whitelist
    if (adapter.config.whitelist === undefined || adapter.config.whitelist.length === 0) adapter.log.debug('Keine Stationen zur Whitelist hinzugefügt');
    else adapter.log.debug('Zahl Stationen in Whitelist: ' + adapter.config.whitelist.length);
    for (var wl in adapter.config.whitelist) {
        adapter.log.debug('Whitelist (#' + (parseInt(wl, 10) + 1) + '): ' + adapter.config.whitelist[wl]);
    }

}

function checkWildcard(station, wildcard) { // thx to stackoverflow.com/a/32402438
    return new RegExp("^" + wildcard.split("*").join(".*") + "$").test(station);
}

// Sendezeit, Name und Sender aus Titel extrahieren
function getShowDetails(titel) {
    let showDetails_arr = titel.split(" | ");                                 // 14:00 | RTL | Formel 1: Großer Preis von Aserbaidschan
    // es können noch weitere Daten extrahiert und geprüft werden:
    // showtime_info = show_info[0].split(':');
    // showtime = new Date ();
    // showtime.setHours(parseInt(showtime_info[0],10));   // -> 16
    // showtime.setMinutes(parseInt(showtime_info[1],10)); // -> 50
    // Vergleich mit aktueller zeit möglich....

    // Suche nach Filmen genauso möglich
    // movie = show_info[2];
    return {
        "time": showDetails_arr[0].trim(),                                      // 14:00
        "station": showDetails_arr[1].trim(),                                   // RTL
        "show": showDetails_arr[2].trim()                                       // Formel 1: Großer Preis von Aserbaidschan
    };
}

// Steht Sender in Whitelist | Blacklist ?
function showStation(titel) { // Eine Sendung/Show wird so übergeben "16:50 | Sky Cinema | Kill the Boss 2"
    var titel_info = titel.split(' | ');

    // Prüfe Sender
    var station = getShowDetails(titel).station; // Sendername aus Titel auslesen
    var display = true; // show em all :-D

    if (adapter.config.whitelist.length === 0) { // if no entry in whitelist use blacklist
        display = (adapter.config.blacklist.indexOf(station, 0) == -1) ? true : false; // station not in blacklist means display = true
    } else { // if at least one entry in whitelist do not use blacklist but whitelist only
        for (var wl in adapter.config.whitelist) {
            display = checkWildcard(station, adapter.config.whitelist[wl]);
            if (display) break; // if wildcard found end "for"
        }
        if (!display) { // if no whildcard found try correct spelling
            display = (adapter.config.whitelist.indexOf(station, 0) != -1) ? true : false; // station not not in whitelist means display = true
        }
        adapter.log.debug(station + ' in Whitelist ?  ' + display);
    }
    return (display); // true | false
}

// RSS Kanäle
const rss_options = {
    jetzt: {
        feedname: 'Jetzt',
        url: 'http://www.tvspielfilm.de/tv-programm/rss/jetzt.xml',
        state: 'json.jetzt',
        stateRaw: 'json.raw.jetzt',
        cssclass: 'tv_jetzt'
    },
    tipps: {
        feedname: 'Tipps',
        url: 'http://www.tvspielfilm.de/tv-programm/rss/tipps.xml',
        state: 'json.tipps',
        stateRaw: 'json.raw.tipps',
        cssclass: 'tv_tipps'
    },
    heute2015uhr: {
        feedname: 'heute 20:15 Uhr',
        url: 'http://www.tvspielfilm.de/tv-programm/rss/heute2015.xml',
        state: 'json.heute2015',
        stateRaw: 'json.raw.heute2015',
        cssclass: 'tv_heute2015'
    },
    heute2200uhr: {
        feedname: 'heute 22:00 Uhr',
        url: 'http://www.tvspielfilm.de/tv-programm/rss/heute2200.xml',
        state: 'json.heute2200',
        stateRaw: 'json.raw.heute2200',
        cssclass: 'tv_heute2200'
    },
    filme: {
        feedname: 'Spielfilm-Highlights des Tages',
        url: 'http://www.tvspielfilm.de/tv-programm/rss/filme.xml',
        state: 'json.filme',
        stateRaw: 'json.raw.filme',
        cssclass: 'tv_filme'
    }
}


function readIndividualFeed(x) {
    var link = rss_options[x].url;
    adapter.log.debug('RSS Feed wird eingelesen: ' + link);
    request(link, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            parseString(body, {
                explicitArray: false,
                mergeAttrs: true
            }, function (err, result) {
                var data = JSON.stringify(result, null, 2);
                var table = [];
                var rawData = [];
                if (err) {
                    adapter.log.warn("Fehler: " + err);
                } else {
                    if (result.rss.channel.item.length !== null) { // gelegentlicher Fehler bei nächtlicher Abfrage durch length (undefined) soll hier abgefangen werden

                        // Array durchzaehlen von 0 bis Zahl der items
                        for (var i = 0; i < result.rss.channel.item.length; i++) {
                            let showThisStation = showStation(result.rss.channel.item[i].title) || false; // Ist der Sender in der Blacklist/Whitelist?
                            if (showThisStation) {
                                let string_found = ""; // CSS Styles werden eingefügt, wenn Suchmuster gefunden (hier immer reset)
                                let titel = result.rss.channel.item[i].title;
                                let sendung = getShowDetails(titel).show;
                                let beschreibung = result.rss.channel.item[i].description;

                                rawData.push({
                                    title: getShowDetails(titel).show,
                                    description: result.rss.channel.item[i].description,
                                    station: getShowDetails(titel).station,
                                    time: getShowDetails(titel).time,
                                    imgUrl: result.rss.channel.item[i].enclosure && result.rss.channel.item[i].enclosure.url ? result.rss.channel.item[i].enclosure.url : ''
                                });

                                if (searchString_arr === undefined || searchString_arr.length === 0 && !searchStringPattern) { // kein Array mit Suchwörter vorhanden?
                                    adapter.log.silly("Search String is empty or not available (#" + i + ")");
                                } else { // Array vornhanden
                                    // Titel auf Suchstring prüfen
                                    if (searchStringPattern.test(sendung) === true) {
                                        adapter.log.debug("Sendung: " + sendung);
                                        adapter.log.debug("Suchmuster im Titel der Sendung gefunden: " + searchStringPattern);
                                        adapter.log.debug("gefundenes Wort (im Namen der Sendung): " + searchStringPattern.exec(sendung));
                                        adapter.log.debug("Gesuchte Sendung: " + getShowDetails(titel).show + " wird heute um " + getShowDetails(titel).time + " Uhr auf " + getShowDetails(titel).station + " ausgestrahlt.");
                                        string_found = string_found_css; // css Style für Treffer
                                        // weitere Aktionen möglich
                                        // z.B. das Setzen eines Flags, das das Senden einer Nachricht auslöst
                                        matches++; // Bei Treffer hochzählen
                                        adapter.log.debug("Matches: " + matches);

                                    }
                                    // Beschreibung auf Suchstring prüfen
                                    if (searchStringPattern.test(beschreibung) === true) {
                                        adapter.log.debug("Suchmuster in Beschreibung gefunden: " + searchStringPattern);
                                        adapter.log.debug("gefundenes Wort (in der Beschreibung): " + searchStringPattern.exec(beschreibung));
                                        adapter.log.debug("Gesuchte Sendung: " + getShowDetails(titel).show + " wird heute um " + getShowDetails(titel).time + " Uhr auf " + getShowDetails(titel).station + " ausgestrahlt.");
                                        string_found = string_found_css; // css Style für Treffer
                                        // weitere Aktionen möglich
                                        // z.B. das Setzen eines Flags, das das Senden einer Nachricht auslöst
                                        matches++; // Bei Treffer hochzählen
                                        adapter.log.debug("Matches: " + matches);
                                    }
                                    // Position des Suchworts im Text markieren
                                    if (searchStringPattern.test(sendung) === true) titel = titel.replace(searchStringPattern, "<mark>$&</mark>");
                                    if (searchStringPattern.test(beschreibung) === true) beschreibung = beschreibung.replace(searchStringPattern, "<mark>$&</mark>");
                                }

                                // Hochkomma noch mit \ escapen, aber auf CSS Styles Einbindung achten

                                var entry = {
                                    image: result.rss.channel.item[i].enclosure ? '<img width="100%" src="' + result.rss.channel.item[i].enclosure.url + '" />' : '',
                                    text: '<table' + string_found + ' class="' + rss_options[x].cssclass + '"><tr><td class="' + rss_options[x].cssclass + '_text" style="text-align: left; padding-left: 5px; font-weight: bold"><a href="' +
                                        result.rss.channel.item[i].link + '" target="_blank">' + titel +
                                        '</a></td></tr><tr><td style="text-align: left; padding-left: 5px">' +
                                        beschreibung + '</td></tr></table>',
                                    _Bild: result.rss.channel.item[i].enclosure ? '<img class="' + rss_options[x].cssclass + '_bild" width="100%" src="' + result.rss.channel.item[i].enclosure.url + '" />' : 'no image'
                                };
                                table.push(entry);
                            } // Ende Abfrage, ob Sender empfangbar
                        }

                    } else adapter.log.warn('LENGTH in TV Programm (' + rss_options[x].feedname + ') nicht definiert'); // ende if ungleich
                }
                adapter.log.warn(rss_options[x].stateRaw);
                adapter.log.error(rawData);
                
                adapter.setState(rss_options[x].state, { val: JSON.stringify(table), ack: true });              // ganze XML in Objekt für Table Widget
                adapter.setState(rss_options[x].stateRaw, { val: JSON.stringify(rawData), ack: true });         // raw daten als json string
            });
        } else adapter.log.warn(error, 'error');
    });   // Ende request
    adapter.log.debug('XML-Daten aus TV Spielfilm (' + rss_options[x].feedname + ') eingelesen');
}

function iterateAllFeeds() {
    matches = 0;
    for (var feeds in rss_options) { // einzelne Feeds laden und speichern
        readIndividualFeed(feeds);
    }

    adapter.log.debug("Endgültige Matches im Suchlauf: " + matches);
    if (matches < 1) { // auf Treffer prüfen
        // keine Sendung gefunden
        adapter.setState("search.alert", { val: false, ack: true }, () => {
            adapter.log.info('objects written');
            setTimeout(() => process.exit(0), 10000);
        });
    } else {
        // mindestens eine Sendung gefunden
        adapter.setState("search.alert", { val: true, ack: true }, () => {
            adapter.log.info('objects written');
            setTimeout(() => process.exit(0), 10000);
        }); // mindestens eine Sendung gefunden
    }
}


function main() {
    readSettings(); // Einstellungen lesen und prüfen
    searchStringCheck(); // Suchbegriffe aus Datenpunkt einlesen und Suchmuster erstellen
    setTimeout(iterateAllFeeds, 2000); // Alle Feeds nacheinander durchgehen

    // Force terminate nach einer Minute
    setTimeout(() => {
        adapter.log.info('force terminating adapter after 1 minute');
        process.exit(1);
    }, 60000);

}
