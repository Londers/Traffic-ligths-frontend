$(function () {
    const ws = new WebSocket('wss://' + location.host + location.pathname + 'W' + location.search);
    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        switch (allData.type) {
            case 'getCharPoints':
                console.log(data);
                break;

        }
    }
    ws.onopen = function () {
        // ws.send(JSON.stringify({type: 'getCharPoints'}))
    }
})