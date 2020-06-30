$(function () {
    $('.fixed-table-toolbar').hide();

    let ws = new WebSocket('ws://' + location.host + location.pathname + 'W' + location.search);

    ws.onerror = function (evt) {
        console.log('WebsSocket error:' + evt);
    };

    ws.onopen = function () {
        // on connecting, do nothing but log it to the console
        console.log('connected');
    };

    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        console.log(data);

        switch (allData.type) {
            case 'suka': break;
            case 'mrazb': break;
            default: break;
        }
    };

    ws.onclose = function () {
        console.log('disconnected');
        // alert('Связь была разорвана');
        // location.reload();
        // automatically try to reconnect on connection loss
    };
});