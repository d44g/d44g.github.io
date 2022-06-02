// config
const NUMVIDS = 1000; 
const VIDDIR = "vid";


// Mode selection
var MP4MODE = false;
var AVCCMODE = false;

// Control videos
let startTime;

// Decoding variables
let assetURLs = [];
let hashes = {};

// AVCC variables
let avccList;

// MP4 variables
let video;
let current = 0;

// control buttons
let controlsLoaded = false;
let buttonNext;
let buttonStart;
let loadedAVCC = 0;
let testName;
let testCount = 0;

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function prepareAssetLists() {
    // Reset variables
    assetURLs = [];
    hashes = {};
    avccList = [];
    loadedAVCC = 0;

    if (AVCCMODE) {
        console.log("[-] Preparing AVCCes and Video List");

        avccList = Array(NUMVIDS*2).fill(0);

        for (let i = 0; i < NUMVIDS; i++) {
            // run each video twice
            let avccUrl = VIDDIR + "/video_" + i.toString().padStart(4, '0') + ".264.avcc.js";

            var script = document.createElement('script');
            // this will open 
            script.onload = function() {
                console.log("[-] Added avcC " + i);
                avccList[2*i] = avcC;
                avccList[2*i + 1] = avcC;
                loadedAVCC++;
                console.log("[-] loadedAVCC: " + loadedAVCC);
                if (loadedAVCC + KNOWNMISSINGAVCC == avccList.length/2) { 
                    loadControls();
                }
            };
            script.src = avccUrl;
            document.head.appendChild(script);

            let vidPath = VIDDIR + "/video_" + i.toString().padStart(4, '0') + ".264.avcc.264";
            assetURLs.push(vidPath);
            assetURLs.push(vidPath);
        }
    } else {
        console.log("[-] Preparing Video List");
        let vidExtension = ".264"
        if (MP4MODE) {
            vidExtension = ".264.mp4"
        }

        for (let i = 0; i < NUMVIDS; i++) {
            let vidPath = VIDDIR + "/video_" + i.toString().padStart(4, '0') + vidExtension;
            //let ofVid = VIDDIR + "/of" + vidExtension;

            // run OF video virst
            //assetURLs.push(ofVid);
            // run each video twice
            //assetURLs.push(vidPath);
            assetURLs.push(vidPath);
        }
    } 
}


function sha256(imageData) {
    return crypto.subtle.digest("SHA-256", imageData.data).then(function (hash) {
        return hex(hash);
    });
}

function hex(buffer) {
    var hexCodes = [];
    var view = new DataView(buffer);
    for (var i = 0; i < view.byteLength; i += 4) {
        var value = view.getUint32(i)
        var stringValue = value.toString(16)
        var padding = '00000000'
        var paddedValue = (padding + stringValue).slice(-padding.length)
        hexCodes.push(paddedValue);
    }

    return hexCodes.join("");
}

function getUnmaskedInfo(gl) {
    var unMaskedInfo = {
        renderer: '',
        vendor: ''
    };

    var dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (dbgRenderInfo != null) {
        unMaskedInfo.renderer = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
        unMaskedInfo.vendor = gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL);
    }

    return unMaskedInfo;
}

function unstable() {
    let unstableKeys = [];
    for (const [videoName, videoHashes] of Object.entries(hashes)) {
        if (videoHashes.length > 0) {
            let h = videoHashes[0];
            for (let i = 1; i < videoHashes.length; i++) {
                if (videoHashes[i] != h) {
                    unstableKeys.push(videoName);
                    break;
                }
            }
        }
    }
    return unstableKeys;
}

function createSubmitForm(img) {
    let submitText = document.createElement("h3");
    submitText.innerText = testCount + ". Submit Results for test '" + testName + "'";
    document.querySelector(".submitform").appendChild(submitText);

    let form = document.createElement("form");
    form.action="https://formspree.io/f/mjvlyolk";
    form.method="POST";

    // create email entry
    let nameLabel = document.createElement("label");
    nameLabel.innerText = "Your email";
    let nameInput = document.createElement("input");
    nameInput.type = "email";
    nameInput.name = "_replyto";
    nameInput.placeholder = "(Optional)"
    nameLabel.appendChild(nameInput);
    form.appendChild(nameLabel);

    // little break
    linebreak = document.createElement("br");
    form.appendChild(linebreak);

    // create console.logs entry
    let bodyLabel = document.createElement("label");
    bodyLabel.innerText = "Results: ";
    let body = document.createElement("textarea");
    body.name = "message";
    body.innerText = JSON.stringify(console.logs);
    body.readOnly = true;
    body.style.width = '400px';
    body.style.height = '200px';
    bodyLabel.appendChild(body);
    form.appendChild(bodyLabel);

    // screenshot the page
    let screenshot = document.createElement("textarea");
    screenshot.name = "screenshot";
    screenshot.innerText = img;
    screenshot.readOnly = true;
    screenshot.style.visibility = "hidden";
    form.appendChild(screenshot);

    // little break
    linebreak = document.createElement("br");
    form.appendChild(linebreak);

    // submit button
    let submitInput = document.createElement("input");
    submitInput.type="submit";
    submitInput.value="Submit";
    form.appendChild(submitInput);
    document.querySelector(".submitform").appendChild(form);

    document.querySelector(".submitform").style.display = "block";
    document.querySelector(".submitform").innerHTML += "<hr>";
}

function finish() {
    testCount++;
    // get duration
    let duration = performance.now() - startTime;
    console.log("Duration: " + duration);

    // show all the hashes
    let pre = document.createElement("pre");
    pre.innerHTML = JSON.stringify(hashes, undefined, 2);
    document.querySelector(".hashes").appendChild(pre);
    // output hashes to console 
    console.log(hashes);

    // update status message
    let status = document.getElementById("statusmessage");
    status.innerHTML = "Status: Done. Duration: " + duration/1000 + " seconds";

    // collect unstable hashes
    let unstableKeys = unstable();
    if (unstableKeys.length > 0) {
        console.log("unstable: " + unstable());
    }

    // create form to send off results
    html2canvas(document.querySelector("#visual")).then(canvas => {
        var img = canvas.toDataURL("image/png");
        //console.log('Image: ' + img);
        createSubmitForm(img);
    }).catch(error => {
        console.log("Issue creating screenshot: " + error.message);
        createSubmitForm("none");
    });
    

    // allow for a new test to be run
    document.getElementById("btnTestChoice").removeAttribute("disabled");
}

function loadAsset() {
    if (current == assetURLs.length) {
        buttonNext.setAttribute("disabled", "true");
        finish();
    } else if (current < assetURLs.length) {
        console.log("Loading asset: " + assetURLs[current]);
        video.src = assetURLs[current];
    }
}

function getHash() {
    var canvas = document.createElement('canvas');
    canvas.id = current;
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // only get hash if greater than 0
    if (canvas.width > 0 && canvas.height > 0) {
        var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        sha256(data).then(function (digest) {
            if (!(assetURLs[current] in hashes)) hashes[assetURLs[current]] = [];

            canvas.setAttribute("data-hash", digest);
            canvas.setAttribute("file", assetURLs[current] );
            console.log("[" + assetURLs[current] + "] frame hash: " + digest);
            document.querySelector(".visual").appendChild(canvas);
            hashes[assetURLs[current]].push(digest);

            //current += 1;
            //loadAsset();
        });
    } else {
        //current += 1;
        //loadAsset();
    }
}

async function runAllVideos() {
    console.log("Start");

    // remove previous results
    removeAllChildNodes(document.querySelector("#visual"));
    removeAllChildNodes(document.querySelector("#hashes"));

    document.getElementById("btnTestChoice").setAttribute("disabled", "true");
    startTime = performance.now();

    if (MP4MODE) {
        buttonNext.removeAttribute("disabled");

        current = 0;
        video = document.createElement('video');
        video.setAttribute("autoplay", "true");
        video.addEventListener('canplay', function () {
            console.log("canplay");
        });
        video.addEventListener('play', function () {
            console.log("play");
        });
        video.addEventListener('stalled', function () {
            console.log("stalled");
        });
        video.addEventListener('ended', function () {
            console.log("ended");
            setTimeout(getHash, 100);
        });
        video.addEventListener('error', function () {
            console.log("error with video " + assetURLs[current]);
            console.log(video.error);
            console.log(video.error.message);

            current += 1;
            //loadAsset();
        });
        
        //loadAsset();
    } else {
        const config = {
            codec: "avc1.64000a",
            codedWidth: 144,
            codedHeight: 82,
            hardwareAcceleration: "prefer-hardware",
        };
        
        VideoDecoder.isConfigSupported(config).then( res => {console.log("VideoDecoder -- support config: " + res.supported);});

        async function decodevids() {
            for (let i = 0; i < assetURLs.length; i++) {
                let assetURL = assetURLs[i];

                console.log("[-] Fetching asset: " + assetURL);
                (await fetch(assetURL)).arrayBuffer().then(async function (buffer) {
                    const init = {
                        output: frame => {
                            var cnv = document.createElement("canvas");
                            cnv.setAttribute("id", "dst" + i);
                            console.log("[" + assetURL + "] Recovered frame");
                            console.log(frame);
                            cnv.height = frame.codedHeight;
                            cnv.width = frame.codedWidth;
                            let ctx = cnv.getContext('2d', {
                                alpha: false
                            });

                            ctx.drawImage(frame, 0, 0, cnv.width, cnv.height);

                            // sha256 hash
                            var data = ctx.getImageData(0, 0, cnv.width, cnv.height);
                            sha256(data).then(function (digest) {
                                if (!(assetURL in hashes)) hashes[assetURL] = [];
                                
                                console.log("[" + assetURL + "] Frame hash: " + digest);
                                cnv.setAttribute("data-hash", digest);
                                cnv.setAttribute("file", assetURL);
                                document.querySelector(".visual").appendChild(cnv);
                                hashes[assetURL].push(digest);
                            });

                            frame.close();
                        },
                        error: (e) => {
                            console.log("[X] Error in decode of " + assetURL);
                            console.log("[" + assetURL + "] " + e.message);
                        }
                    };
                    
                    const config = {
                        codec: "avc1.64000a",
                        codedWidth: 144,
                        codedHeight: 82,
                    };

                    if (AVCCMODE) {
                        config.description = avccList[i]; 
                    }                

                    let decoder = new VideoDecoder(init);
                    decoder.configure(config);
                    console.log("[" + assetURL + "] configured decoder");

                    let chunk = new EncodedVideoChunk({
                        type: "key",
                        timestamp: 50,
                        data: buffer,
                    });
                    console.log("[" + assetURL + "] gonna decode chunk now");
                    decoder.decode(chunk);
                    await decoder.flush();
                    await decoder.close();
                }).catch(error => {
                    console.log("[X] Error inside fetch of  " + assetURL);
                    console.log("[" + assetURL + "] " + error.message);
                });
            }
            setTimeout( function(){
                console.log("lil wait");
            }, 3000 );
        }
        await decodevids();
        console.log("End");
        finish();
    }
}

function logUserAgentAndGPU(){
    console.log(navigator.userAgent);
    let canvas = document.getElementById("glcanvas");
    let gl = canvas.getContext("experimental-webgl");
    console.log(gl.getParameter(gl.RENDERER));
    console.log(getUnmaskedInfo(gl).renderer);
}

function loadControls() {
    controlsLoaded = true;
    // update the test message
    var testMessage = document.getElementById("testMessage");
    testMessage.innerHTML = "The experiment should take at most 20 minutes."


    // create the buttons
    buttonStart = document.createElement("button");
    buttonStart.setAttribute("type", "button");
    buttonStart.setAttribute("id", "btnStart");
    buttonStart.setAttribute("class", "btn btn-primary");
    buttonStart.innerHTML = "Run Videos";
    buttonStart.addEventListener("click", function () {
        logUserAgentAndGPU();

        buttonStart.setAttribute("disabled", "true");
        document.querySelector(".fingerprint").style.display = "block";

        var status = document.getElementById("statusmessage");
        status.innerHTML = "Status: Working";

        runAllVideos();
    });
    document.querySelector(".controls").appendChild(buttonStart);

    if (MP4MODE) {
        testMessage.innerHTML += " Only press 'Next Video' if you don't see progress in the Status window.";
        buttonNext = document.createElement("button");
        buttonNext.setAttribute("type", "button");
        buttonNext.setAttribute("class", "btn btn-primary");
        buttonStart.setAttribute("id", "btnNext");
        buttonNext.setAttribute("disabled", "true");
        buttonNext.innerHTML = "Next Video";
        buttonNext.addEventListener("click", function () {
            console.log("[-] 'Next Video' pressed");
            current += 1;
            loadAsset();
        });
        document.querySelector(".controls").appendChild(buttonNext);
    }

    document.querySelector(".controls").style.display = "block";
}

function prepareTest(){
    testName = document.querySelector('input[name="testName"]:checked').value;
    console.log("Preparing " + testName + " test");
    document.getElementById("currentTest").innerHTML = testName;
    
    // if previously loaded then reset parameters
    if (controlsLoaded) {
        document.querySelector(".controls").style.display = "none";
        console.log("-- Removing previous buttons");
        buttonStart.setAttribute("disabled", "true");
        buttonStart.remove();
        if (buttonNext) {
            console.log("-- Removing next button");
            buttonNext.remove();
        }
    }
    
    if (testName == "mp4") {
        MP4MODE = true;
        AVCCMODE = false;
    } else if (testName == "avcc") {
        MP4MODE = false;
        AVCCMODE = true;
    } else if (testName == "annexb") {
        MP4MODE = false;
        AVCCMODE = false;
    }

    prepareAssetLists();

    if (testName == "mp4" || testName == "annexb") {
        loadControls();
    }
    
    console.log("[-] Prepared");
}


// console logs
console.stdlog = console.log.bind(console);
console.logs = [];
console.log = function(){
    console.logs.push(Array.from(arguments));
    console.stdlog.apply(console, arguments);
    var con = document.getElementById("realtimeconsole");
    con.innerHTML += Array.from(arguments) + "<br>";
    con.scrollTop = con.scrollHeight;
}

window.addEventListener('load', function () {
    if ("VideoDecoder" in window) {
        console.log("WebCodecs supported :)");
    } else {
        var annexbTest = document.getElementById("annexb");
        annexbTest.setAttribute("disabled", "true");
        var annexbLabel = document.getElementById("annexblabel");
        annexbLabel.innerHTML += " (WebCodecs Required)";

        var avccTest = document.getElementById("avcc");
        avccTest.setAttribute("disabled", "true");
        var avccLabel = document.getElementById("avcclabel");
        avccLabel.innerHTML += " (WebCodecs Required)";

        this.document.getElementById("mp4").setAttribute("checked", "true");
    }
})

