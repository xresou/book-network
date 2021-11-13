window.onload = function () {
    document.getElementById("form")
        .setAttribute("action", window.location.protocol + "//" + window.location.hostname +
            (window.location.port == "" ? "" : ":" + window.location.port) + "/authors");
};