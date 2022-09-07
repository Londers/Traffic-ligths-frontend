// let region = "1"

$(function () {
    const ws = new WebSocket('wss://' + location.host + location.pathname + 'W' + location.search);
    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        switch (allData.type) {
            case 'xctrlInfo':
                console.log(data);
                break;
            case 'xctrlUpdate':
                console.log(data);
                break;
            case 'getStatistics':
                console.log(data);
                break;
            case 'statisticsUpdate':
                console.log(data);
                break;
        }
    }
    ws.onopen = function () {
        // ws.send(JSON.stringify({type: 'getDevices', region: region}))
    }

    // $('body').append('<button id="stopD">stop devices</button>')
    // $('#stopD').on('click', () => ws.send(JSON.stringify({type: 'stopDevices'})))
    //
    // $('body').append('<button id="startD">start devices</button>')
    // $('#startD').on('click', () => ws.send(JSON.stringify({type: 'getDevices', region: region})))
    //
    // $('body').append('<button id="stopS">stop statistics</button>')
    // $('#stopS').on('click', () => ws.send(JSON.stringify({type: 'stopStatistics'})))
    //
    // $('body').append('<button id="startS">start statistics</button>')
    // $('#startS').on('click', () => ws.send(JSON.stringify({type: 'getStatistics', region: region})))

    setTimeout(() => ws.send(JSON.stringify({type: "getStatistics", region: "1"})), 3000)
    setTimeout(() => ws.send(JSON.stringify({type: "stopStatistics"})), 6000)
    setTimeout(() => ws.send(JSON.stringify({type: "getOldStatistics", region: "3", date: new Date(2022,3,4, 12).toISOString()})), 9000)
    setTimeout(() => ws.send(JSON.stringify({type: "getOldStatistics", region: "3", date: new Date(2022, 3, 16, 12).toISOString()})), 12000)

})