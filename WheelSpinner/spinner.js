
// !!--SETTINGS--!!
const WEBSOCKET_URI = "ws://127.0.0.1:8080/"; // The Streamer.Bot websocket. Found under "Servers/Clients".
const ACTION_ID = "6c00f131-30f5-4991-8e1a-eafdb5f497c8"; // "Wheel Winner" action ID, aka the action to call once the wheel has spun and a winner has been picked.

const leftSide = true; //Whether the wheel's winning result & picking arrow should be on the left (will be on the right if false)
const repeatColors = true; //Whether to repeat colours given (for specific slices). If false, will use the gradients for the rest of the wheel
const durationRange = [3000, 6000]; //in milliseconds. Range of duration [minimum, maximum]
const fontCase = {"lower": false, "upper": false, "original": true}; //choose 1. Decides what case to display the entries' text in. lowercase/uppercase/as given

// --End of Settings--



const font_url = "";//"https://fonts.googleapis.com/css?family=Press+Start+2P";
//ToDo: figure out how to make the fonts work, and then move it into the settings section

const wheelEl = document.getElementById("wheel");
const spinnerDiv = document.getElementsByClassName("spinner")[0];
const sideClass = {"left": "left", "right": "right"};
const contents = {"contents": [/* {entry, color} */]};
const numOfSpins = [5, 9];

const params = new URLSearchParams(window.location.search);
let picture = params.get("img") || "https://streamer.bot/logo-300x300.png";
let valuesPath = params.get("values") || "";
let spinPath = params.get("spin") || "";
let folderPath = "";
let sbWs; //Streamer.Bot WebSocket

//Helper function
    //Sets the picture in the middle of the wheel
function setMidPic(src = picture) {
    let midPic = document.getElementById("midPic");
    midPic.onerror = (event) => {
        console.warn("initial midPic src set fail. Trying to parse");
        src = parsePath(src);
        midPic.onerror = (event) => {
            console.warn("parsed midPic src set fail. Trying to add ./");
            src = parsePath("./" + src);
            midPic.src = src;
        };
        midPic.src = src;
    };
    midPic.src = src;
}
    //Color translations/parsing
/**
 * Returns an array of colours forming a gradient between the given colors. Colors must be well formatted.
 * @param {string} from First color of the gradient
 * @param {string} to Last color of the gradient
 * @param {int} count How many colors should be in the gradient (minimum 2)
 * @returns {Array<String> | null} Array containing the gradient's colors, in order, well-formatted. If any given parameter is illegal, returns null.
 */
function generateGradient(from, to, count) {
    if(typeof from == typeof "hi" && typeof to == typeof "hi" && Number.isInteger(count)) {
        from = initNormalizeColor(from);
        to = initNormalizeColor(to);
        let nextColor = (start, difference) => {
            let toRet = (parseInt(start, 16) + parseInt(difference, 16));
            while(toRet < 0) {toRet += 256;}
            while(toRet > 255) {toRet -= 256;}
            return toRet.toString(16).padStart(2, "0");
        }
        if(from != null && to != null && count > 0) {
            if(count == 1) {return [normalizeColor(from)];}
            let colors = [];
            let r = from.slice(0, 2), g = from.slice(2, 4), b = from.slice(4, 6), a = from.slice(6, 8);
            //deltas:
            let rd = to.slice(0, 2), gd = to.slice(2, 4), bd = to.slice(4, 6), ad = to.slice(6, 8);
            rd = Math.floor((parseInt(rd, 16) - parseInt(r, 16))/(count-1)).toString(16);
            gd = Math.floor((parseInt(gd, 16) - parseInt(g, 16))/(count-1)).toString(16);
            bd = Math.floor((parseInt(bd, 16) - parseInt(b, 16))/(count-1)).toString(16);
            ad = Math.floor((parseInt(ad, 16) - parseInt(a, 16))/(count-1)).toString(16);
            for(let i = 0; i < count; i++) {
                colors[i] = "rgba(" + parseInt(r, 16) + "," + parseInt(g, 16) + "," + parseInt(b, 16) + "," + (parseInt(a, 16)/255.0) + ")";
                r = nextColor(r, rd);
                b = nextColor(b, bd);
                g = nextColor(g, gd);
                a = nextColor(a, ad);
            }
            colors[colors.length-1] = normalizeColor(to);
            return colors;
        }
    } else {
        console.log("Invalid parameter type/s (generateGradient)");
    }
}

/**
 * Returns whether the given color is well-fromatted and valid (FFF / FFFFFF / FFFFFFFF formats, 0-F, lowercase/uppercase allowed, 1 leading # allowed, rgba() / rgba() formats allows with 0-255 (0-1 for the alpha) values separated by commas (,))
 * @param {String} color The color to check
 * @returns {Boolean} Whether the color is valid
 */
function validateColor(color) {
if(color == null) {return false;}
let isValid = (typeof color == typeof "hi");
color = color.toLowerCase();
let validChars = "0123456789abcdefABCDEF";
if(color[0] == "#") {
    color = color.substring(1);
} else {
    let surroundings = [["rgb(", ")"], ["rgba(", ")"]];
    surroundings.forEach((entry) => {
        if(color.toLowerCase().startsWith(entry[0]) && color.toLowerCase().endsWith(entry[1])) {
            color = color.substring(entry[0].length, color.length - entry[1].length);
            color = color.split(",").map(entry => parseInt(entry).toString(16).padStart(2,"0")).join("");
        }
    });
}
let tmpColor = color;
for(let i = 0; i < validChars.length; i++) {
    tmpColor = tmpColor.replaceAll(validChars[i], "");
}
isValid = isValid && tmpColor.length == 0 && (color.length == 3 || color.length == 6 || color.length == 8);
return isValid;
}

/**
 * Returns the given color in a normalized ffffffff (rgba) format
 * @param {string} color The color to normalize. Must be well formatted (See {@link validateColor} for allowed formats)
 * @returns {string | null} The normalized color, or null if the given color isn't valid.
 */
function initNormalizeColor(color) {
let retColor = "";
if(validateColor(color)) {
    let surroundings = [["rgb(", ")"], ["rgba(", ")"]];
    surroundings.forEach((entry) => {
        if(color.toLowerCase().startsWith(entry[0]) && color.toLowerCase().endsWith(entry[1])) {
            color = color.substring(entry[0].length, color.length - entry[1].length);
            color = color.split(",").map((entry, i) => {
                if(i < 3) {
                return parseInt(entry).toString(16).padStart(2,"0");
                }
                //alpha channel
                return (parseFloat(entry)*255).toString(16).padStart(2,"0");
            }).join("");
        }
    });
    retColor = color.replace("#", "");
    switch(color.length) {
        case 3:
            retColor = color[0] + color[0] + color[1] + color[1] + color[2] + color[2] + "ff";
            break;
        case 6:
            retColor += "ff";
    }
    return retColor;
}
return null;
}

/**
 * Returns the given color in a normalized rgba(#, #, #, #) format
 * @param {string} color The color to normalize. Must be well formatted (See {@link validateColor} for allowed formats)
 * @returns {string | null} The normalized color, or null if the given color isn't valid
 */
let normalizeColor = (color) => {
let firstStep = initNormalizeColor(color);
if(firstStep == null) {return null;}
return "rgba(" + parseInt(firstStep.slice(0,2), 16) + "," + parseInt(firstStep.slice(2,4), 16) + "," + parseInt(firstStep.slice(4,6), 16) + "," + (parseInt(firstStep.slice(6,8), 16)/255.0) + ")";
};
    //JSON reading
/**
 * Extracts a specified array from an object containing its restructured form, as passed by Streamer.Bot
 * @param {Object} data The object containing the restructured-array
 * @param {string} property The property name to look for (the array's name)
 * @returns {Array} The array
 */
function arrFromJsonData(data, property) {
    let regex = new RegExp(property + "\\\[[\\\d]+\\\]", "g");
    return Object.keys(data).filter(key => key.match(regex) == key).map((key) => {return data[key]});
}
    //path parsing
/**
 * Parses a path. Can handle: ./ , ../
 * @param {String} path The path to parse
 * @param {String} folder A reference folder the path is relative too. Should be absolute.
 * @returns {String} The parsed path
 */
function parsePath(path, folder = folderPath) {
    if(typeof folder != typeof "hi") {folder = "";}
    folder = folder.replace(/\\/g, "/");
    path = path.replace(/\\/g, "/");
    if(path.startsWith("./")) {
        path = path.replace("./", folder);
    }
    let parts = path.split("/");
    let newParts = [];
    parts.forEach((part, i) => {
        if(part == "..") {
            newParts.pop();
        } else {
            newParts.push(part);
        }
    });
    return newParts.join("/");
}
valuesPath = parsePath(valuesPath);
spinPath = parsePath(spinPath);

//Wheel setup
/**
 * Initial setup for the page.
 */
function initialSetUp(){
    if(leftSide) {
        spinnerDiv.classList.add(sideClass.left);
    } else {
        spinnerDiv.classList.add(sideClass.right);
    }
    if(fontCase.lower) { spinnerDiv.style.setProperty("text-transform", "lowercase"); }
    else if (fontCase.upper) { spinnerDiv.style.setProperty("text-transform", "uppercase"); }
    if(font_url != null && font_url != "") {
        let loadFont = new FontFace("Custom Font", `url(${font_url})`);
        loadFont.load().then( //ToDo: figure out how to make the fonts work
            (font) => {
                document.fonts.add(font);
                console.log("Font loaded"); 
            }
        ).catch((err) => {console.log("Failed to load font."); console.log(err)});
        
    }
}
initialSetUp();
/**
 * Calculates the background colour property for the wheel
 * @param {Array<{color: string}} wheelContent The contents of the wheel
 * @returns {String} The string to use for the wheel's background
 */
function extractBGColours(wheelContent = contents.contents){
    let entryCount = wheelContent.length;
    if(entryCount < 1) {
        return "#888";
    }
    let rotationPercentagePerPiece = 100/entryCount;
    return "conic-gradient(" + "from " + (leftSide ? -90 + 180/entryCount : 360/entryCount) + "deg, " + 
        wheelContent.map((item, i) => {
            return item.color + " " + (i * rotationPercentagePerPiece) + "%" + ", " + item.color + " " + ((i + 1) * rotationPercentagePerPiece) + "%";
    }).join(", ") + ")";
}
/**
 * Initializes the wheel
 * @param {Array<{entry: string, color: string}>} wheelContent The contents of the wheel
 */
function refreshWheel(wheelContent = contents.contents){
    let entryCount = wheelContent.length;
    let entryBase = document.createElement("li");
    if(leftSide) {
        entryBase.classList.add(sideClass.left);
    } else {
        entryBase.classList.add(sideClass.right);
    }
    let entry;
    wheelEl.innerHTML = ""; //Clear out the wheel
    wheelEl.style.setProperty("animation-name", null);
    document.getElementsByTagName("body")[0].style.setProperty("--prize-count", Math.max(1, wheelContent.length));

    //populate the wheel:
    for(let i = 0; i < entryCount; i++) {
        entry = entryBase.cloneNode(false);
        wheelEl.appendChild(entry);
        entry.style.setProperty("--rotation", i*(360/entryCount));
        entry.innerHTML = wheelContent[i].entry;
    }
    let bgProp = "";
    /*if(leftSide) {
        bgProp = extractBGColours(wheelContent.toReversed()); //apparently OBS browser does not recognize toReversed
    } else {
        bgProp = extractBGColours(wheelContent);
    }*/
    let use4bg = Array.from(wheelContent);
    if(leftSide) {
        use4bg.forEach((item, i, arr) => {arr[i] = wheelContent[arr.length - 1 - i];});
    }
    bgProp = extractBGColours(use4bg);
    wheelEl.style.setProperty("background", bgProp);
}
/**
 * Spins the wheel and returns the result and duration of the spin. Does not initialize the wheel. Returns as the spin starts.
 * @param {Array<{entry: string, color: string}>} entries The entries used for the wheel (only used for returning winner information)
 * @returns {{index: int, pickedEntry: {entry: string, color: string}, spinDuration: int}} Winning information (which entry won + its index within the array) and the duration the wheel will spin for (in milliseconds). If {@link entries} is empty, Winning information will be meaningless (index -1, empty entry)
 */
function spinWheel(entries = contents.contents){
    //reset animation state:
    wheelEl.style.setProperty("animation-name", null);
    wheelEl.offsetHeight; /* trigger reflow */

    //set animation properties:
    wheelEl.style.setProperty("--start-spin-at", 0);
    let stoppedAt = Math.random();
    stoppedAt = (stoppedAt * (numOfSpins[1] - numOfSpins[0]) + numOfSpins[0]) * 360;
    wheelEl.style.setProperty("--end-spin-at", stoppedAt);
    let duration = Math.floor(Math.random() * (durationRange[1] - durationRange[0]) + durationRange[0]);
    wheelEl.style.setProperty("animation-duration", duration + "ms");
    //wheelEl.style.setProperty("animation-fill-mode", "forwards");

    //Assign/Trigger animation
    wheelEl.style.setProperty("animation-name", "animateSpin");

    //calculate the index of the slice the wheel will land on (index in entries)
    if(entries.length > 0) {
        stoppedAt += 180/entries.length; // account for starting mid-slice
        stoppedAt = Math.floor((stoppedAt % 360)/360*entries.length );
    } else {
        return {"index": -1, "pickedEntry": {}, "spinDuration": duration};
    }
    
    return {"index": stoppedAt, "pickedEntry": entries[stoppedAt], "spinDuration": duration};
}
//Spin
/**
 * Spins the wheel and then calls {@link winnerPicked}
 * @param {WebSocket} webSocket The WebSocket to use (should be connected to Streamer.Bot)
 */
function triggerSpin(webSocket, entries = contents.contents){
    //refreshWheel(entries);
    let results = spinWheel(entries);
    setTimeout(winnerPicked, results.spinDuration, webSocket, results.pickedEntry.entry, results.index);
}

//Send result
/**
 * Tells Streamer.Bot to call the winner picked action
 * @param {WebSocket} webSocket The websocket to use (should be connected to Streamer.Bot)
 * @param {String} winnerResult The winner/result of the spin
 * @param {Int} resultIndex The index of the winning entry in the entries array
 */
function winnerPicked(webSocket, winnerResult, resultIndex) {
    webSocket.send(
        JSON.stringify({
            request: "DoAction",
            id: "WinnerAction",
            action: {
                id: ACTION_ID
            },
            args: {
                winner: winnerResult,
                indx: resultIndex
            }
        })
    );
}

//webhook setup
/**
 * Subscribes to Streamer.Bot's events. To be used as a websocket's onopen function.
 * @param {Event} event The event
 */
function trySub(event) {
    let webSocket = event.currentTarget;
    webSocket.send(JSON.stringify({
        "request": "Subscribe",
        "id": "trySub",
        "events": {
            "fileWatcher": [
                "Changed",
                "Created"
            ]
        },
    }));
    console.info("Websocket successfully connected at " + webSocket.url);
}

/**
 * To be used as a websocket's onmessage function.
 * @param {Event} event The event
 */
function handleMessage(event) { //ToDo: finish this
    let response = event.data;
    let webSocket = event.currentTarget;
    console.log(JSON.parse(response).event);
    console.log(event);
    if(JSON.parse(response).event != null && JSON.parse(response).event.source == "FileWatcher") {
        let fileName = JSON.parse(response).data.fileName;
        return handleFileWatcher(event, fileName, webSocket);
    }
}
/**
 * Handles being called for a file change/creation
 * @param {Event} event The calling event
 * @param {String} fileName The the name of the file that changed
 */
function handleFileWatcher(event, fileName, webSocket = sbWs) {
    if(valuesPath != "" && (fileName == valuesPath || fileName.endsWith(valuesPath[0] == "/" ? valuesPath : "/" + valuesPath) || valuesPath.endsWith(fileName[0] == "/" ? fileName : "/" + fileName))) {
        //Get folderPath, if passed:
        let fPath = "";
        
        //Extract and update the wheel's contents
        let entries = [];
        let values = []; //entry values/names
        let colors = []; //entry colors
        let inputGrads = [];
        let inputColors = [];

        let response = event.data;
        let fileContents = JSON.parse(response).data.data;

        //Extract JSON data
        if(fileContents == null) {
            fileContents = JSON.parse(JSON.parse(response).data.lines.join("\n"));
            values = fileContents.entries;
            inputGrads = fileContents["colorGradient"];
            inputColors = fileContents["colors"];
        } else {
            values = arrFromJsonData(fileContents, "entries");
            inputGrads = arrFromJsonData(fileContents, "colorGradient");
            inputColors = arrFromJsonData(fileContents, "colors");
        }
        values = Array.from(values);
        inputGrads = Array.from(inputGrads);
        inputColors = Array.from(inputColors);

        //folderPath:
        fPath = fileContents["folderPath"];
        if(fPath == null) {fPath = "";}
        folderPath = fPath;
        
        setMidPic(parsePath(picture));

        //Figure out the colours
        colors = generateGradient("444", "CCC", values.length); //Default colours, to be overwritten by the ones entered
        //Gradient:
        let tmp = [];
        inputGrads.forEach((color) => {
            color = normalizeColor(color);
            if(color != null) { tmp.push(color); }
        });
        inputGrads = tmp;
        if(inputGrads.length == 1) {
            colors.forEach((color, i) => colors[i] = inputGrads[0]);
        } else {
            for(let i = 0; i < inputGrads.length; i++) {
                if(i == 0) { colors = generateGradient(inputGrads[0], inputGrads[1], Math.round(values.length/inputGrads.length)); if(colors == null) { colors = []; } }
                else if (i >= inputGrads.length - 1) { colors.push(...generateGradient(inputGrads[i], inputGrads[0], values.length - colors.length + 2).slice(1, -1)); } //Both ends have already been added previously in the loop
                else { colors.push(...generateGradient(inputGrads[i], inputGrads[i + 1], Math.round(values.length / inputGrads.length * (i+1) - colors.length + 1)).slice(1)); } //The first colour has already been added by the last iteration of the loop
            }
        }
        //Specific colors
        let currentColor;
        for(let i = 0; i < values.length; i++) {
            if(repeatColors) {
                currentColor = normalizeColor(inputColors[i % inputColors.length]);
            } else {
                currentColor = normalizeColor(inputColors[i]);
            }
            if(currentColor != null) {
                colors[i] = currentColor;
            }
        }

        //Build entries:
        entries = values.map((value, i) => {return {"entry": value, "color": colors[i]}; } );

        //Refresh the wheel
        contents.contents = entries;
        refreshWheel(entries);
    }
    else if (spinPath != "" && (fileName == spinPath || fileName.endsWith(spinPath[0] == "/" ? spinPath : "/" + spinPath) || spinPath.endsWith(fileName[0] == "/" ? fileName : "/" + fileName))) {
        let response = event.data;
        let fileContents = JSON.parse(response).data.data;
        if(webSocket == null) { webSocket = sbWs; }

        //Extract JSON data
        if(fileContents == null) {
            fileContents = JSON.parse(JSON.parse(response).data.lines.join("\n"));
        }
        if(fileContents.call == true) {
            triggerSpin(webSocket, contents.contents);
        }
    }
}

/**
 * Connects a websocket to a given url (Streamer.bot's). Attempts to reconnect if fails/the connection closes.
 * @param {WebSocket} webSocket The websocket to use.
 * @param {String} url The url to connect the websocket at. Defaults to {@link WEBSOCKET_URI}.
 * @param {Function} onopen The function to call when the websocket opens (connects). Defaults to {@link trySub}.
 * @param {Function} onmessage A function to call when the websocket recieves the onmessage event. Defaults to {@link handleMessage}
 */
function connectWebsocket(webSocket, url = WEBSOCKET_URI, onopen = trySub, onmessage = handleMessage) {
    if(url == null || url == "") { url = WEBSOCKET_URI; }
    if(typeof onopen != typeof trySub) { onopen = trySub; }
    if(typeof onmessage != typeof handleMessage) { onmessage = handleMessage; }
    if(webSocket == null || webSocket.readyState == 3) {
        console.log("Websocket attempting to " + ((webSocket != null)?"re":"") + "connect at " + url);
        webSocket = new WebSocket(url);

        webSocket.onmessage = onmessage;

        webSocket.onopen = onopen;
		
		webSocket.onclose = (event) => {
			setTimeout(connectWebsocket(webSocket), 300);
		}

    } else {
        console.log("connectWebsocket was called but the websocket isn't closed. Websocket state: " + webSocket.readyState + ", websocket:");
		console.log(webSocket);
    }
}


connectWebsocket(sbWs);
