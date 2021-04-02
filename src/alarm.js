$(function () {
    const ws = new WebSocket('wss://' + location.host + location.pathname + 'W' + location.search);

    ws.onopen = function () {
        console.log('connected');
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
    };

    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        switch (allData.type) {
            case 'alarm':
                console.log(allData);
                break;
            case 'close':
                ws.close();
                window.close();
                break;
        }
    }
});