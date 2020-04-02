/*global systemDictionary:true */
"use strict";

systemDictionary = {
    "stations": {
      "en": "TV channels",
      "de": "Fernsehsender",
      "ru": "Телеканалы",
      "pt": "canais de televisão",
      "nl": "TV-zenders",
      "fr": "chaînes de télé",
      "it": "canali tv",
      "es": "canales de televisión",
      "pl": "Kanały telewizyjne",
      "zh-cn": "电视频道"
    },
    "Unwanted stations": {
      "en": "List of stations to be skipped in processing:",
      "de": "Liste der Stationen, die bei der Verarbeitung übersprungen werden sollen:",
      "ru": "Список станций, которые будут пропущены при обработке:",
      "pt": "Lista de estações a serem puladas no processamento:",
      "nl": "Lijst van stations die bij de verwerking moeten worden overgeslagen:",
      "fr": "Liste des stations à ignorer lors du traitement:",
      "it": "Elenco delle stazioni da saltare nell'elaborazione:",
      "es": "Lista de estaciones a omitir en el procesamiento:",
      "pl": "Lista stacji, które należy pominąć podczas przetwarzania:",
      "zh-cn": "处理中要跳过的电台列表："
    },
    "Selected stations:": {
      "en": "Only these stations will be displayed (if whitelist is used, blacklist will be disregarded):",
      "de": "Es werden nur diese Sender angezeigt (wenn eine Whitelist verwendet wird, wird die Blacklist nicht berücksichtigt):",
      "ru": "Будут отображаться только эти станции (если используется белый список, черный список будет игнорироваться):",
      "pt": "Somente essas estações serão exibidas (se a lista de permissões for usada, a lista negra será desconsiderada):",
      "nl": "Alleen deze stations worden weergegeven (als de witte lijst wordt gebruikt, wordt de zwarte lijst genegeerd):",
      "fr": "Seules ces stations seront affichées (si la liste blanche est utilisée, la liste noire sera ignorée):",
      "it": "Verranno visualizzate solo queste stazioni (se viene utilizzata la whitelist, la blacklist verrà ignorata):",
      "es": "Solo se mostrarán estas estaciones (si se usa la lista blanca, no se tendrá en cuenta la lista negra):",
      "pl": "Wyświetlane będą tylko te stacje (jeśli zostanie użyta biała lista, czarna lista zostanie zignorowana):",
      "zh-cn": "仅显示这些电台（如果使用白名单，则将忽略黑名单）："
    },
    "Blacklist": {
      "en": "Blacklist",
      "de": "Blacklist",
      "ru": "Черный список",
      "pt": "Lista negra",
      "nl": "Zwarte lijst",
      "fr": "Liste noire",
      "it": "Lista nera",
      "es": "Lista negra",
      "pl": "Czarna lista",
      "zh-cn": "黑名单"
    },
    "Blacklist_helper": {
      "en": "Opt out specific stations.",
      "de": "Deaktivieren Sie bestimmte Stationen.",
      "ru": "Отказаться от конкретных станций.",
      "pt": "Desative estações específicas.",
      "nl": "Afmelden voor specifieke stations.",
      "fr": "Désactivez des stations spécifiques.",
      "it": "Annulla le stazioni specifiche.",
      "es": "Optar por estaciones específicas.",
      "pl": "Zrezygnuj z określonych stacji.",
      "zh-cn": "退出特定电台。"
    },
    "Whitelist": {
      "en": "Whitelist",
      "de": "Whitelist",
      "ru": "Whitelist",
      "pt": "Lista de permissões",
      "nl": "Witte lijst",
      "fr": "Liste blanche",
      "it": "Lista bianca",
      "es": "Lista blanca",
      "pl": "Biała lista",
      "zh-cn": "白名单"
    },
    "Whitelist_helper": {
      "en": "To display only a specific list of stations add the stations names to the whitelist. The blacklist will be skipped if the whitelist is not empty.",
      "de": "Um nur eine bestimmte Liste von Sendern anzuzeigen, fügen Sie die Sendernamen zur Whitelist hinzu. Die schwarze Liste wird übersprungen, wenn die Whitelist nicht leer ist.",
      "ru": "Для отображения только определенного списка станций добавьте названия станций в белый список. Черный список будет пропущен, если белый список не пуст.",
      "pt": "Para exibir apenas uma lista específica de estações, adicione os nomes das estações à lista de permissões. A lista negra será ignorada se a lista de permissões não estiver vazia.",
      "nl": "Om alleen een specifieke lijst met stations weer te geven, voegt u de stationsnamen toe aan de witte lijst. De zwarte lijst wordt overgeslagen als de witte lijst niet leeg is.",
      "fr": "Pour afficher uniquement une liste spécifique de stations, ajoutez les noms des stations à la liste blanche. La liste noire sera ignorée si la liste blanche n'est pas vide.",
      "it": "Per visualizzare solo un elenco specifico di stazioni, aggiungere i nomi delle stazioni alla lista bianca. La lista nera verrà ignorata se la whitelist non è vuota.",
      "es": "Para mostrar solo una lista específica de estaciones, agregue los nombres de las estaciones a la lista blanca. La lista negra se omitirá si la lista blanca no está vacía.",
      "pl": "Aby wyświetlić tylko określoną listę stacji, dodaj nazwy stacji do białej listy. Czarna lista zostanie pominięta, jeśli biała lista nie jest pusta.",
      "zh-cn": "要仅显示特定的电台列表，请将电台名称添加到白名单中。如果白名单不为空，则将跳过黑名单。"
    },
    "Divided by comma": {
      "en": "Separated by comma",
      "de": "Durch Komma getrennt",
      "ru": "Разделяется запятой",
      "pt": "Separado por vírgula",
      "nl": "Gescheiden door komma's",
      "fr": "Séparé par une virgule",
      "it": "Separato da virgola",
      "es": "Separado por coma",
      "pl": "Rozdzielone przecinkiem",
      "zh-cn": "以逗号分隔"
    },
    "Abfrageinfo": {
        "en": "The data of the source feed are updated by the server at tankerkoenig.de only every 4 minutes. The shortest polling interval is therefore 5 minutes because a more frequent polling makes no sense.",
        "de": "Die Daten des Quellfeeds werden vom Server bei tankerkoenig.de nur alle 4 Minuten aktualisiert. Das kürzeste Abfrageintervall beträgt daher 5 Minuten, da eine häufigere Abfrage keinen Sinn macht.",
        "ru": "Данные исходного канала обновляются сервером по адресу tankerkoenig.de только каждые 4 минуты. Поэтому самый короткий интервал опроса составляет 5 минут, потому что более частый опрос не имеет смысла.",
        "pt": "Os dados do feed de origem são atualizados pelo servidor em tankerkoenig.de somente a cada 4 minutos. O menor intervalo de pesquisa é, portanto, de 5 minutos, porque uma pesquisa mais freqüente não faz sentido.",
        "nl": "De gegevens van de bronfeed worden slechts om de vier minuten bijgewerkt door de server op tankerkoenig.de. Het kortste polling-interval is daarom 5 minuten omdat een frequentere polling geen zin heeft.",
        "fr": "Les données du flux source ne sont mises à jour par le serveur sur tankerkoenig.de que toutes les 4 minutes. L'intervalle d'interrogation le plus court est donc de 5 minutes, car une interrogation plus fréquente n'a aucun sens.",
        "it": "I dati del feed di origine vengono aggiornati dal server su tankerkoenig.de solo ogni 4 minuti. L'intervallo di polling più breve è quindi di 5 minuti perché un sondaggio più frequente non ha senso.",
        "es": "El servidor de tankerkoenig.de actualiza los datos de la fuente de alimentación solo cada 4 minutos. Por lo tanto, el intervalo de sondeo más corto es de 5 minutos porque un sondeo más frecuente no tiene sentido.",
        "pl": "Dane z kanału źródłowego są aktualizowane przez serwer na tankerkoenig.de tylko co 4 minuty. Najkrótszy interwał sondowania wynosi zatem 5 minut, ponieważ częstsze sondowanie nie ma sensu.",
        "zh-cn": "服务器在tankerkoenig.de仅每4分钟更新一次源数据。因此，最短的轮询间隔是5分钟，因为更频繁的轮询是没有意义的。"
    },
    "Settings": {
        "en": "settings",
        "de": "Einstellungen",
        "ru": "настройки",
        "pt": "definições",
        "nl": "instellingen",
        "fr": "réglages",
        "it": "impostazioni",
        "es": "ajustes",
        "pl": "ustawienia",
        "zh-cn": "设置"
    }
};
