// let region = "1"

// $(function () {
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

    let q = JSON.parse("{\n" +
        "    \"ext\": [\n" +
        "        [\n" +
        "            1,\n" +
        "            2\n" +
        "        ],\n" +
        "        [\n" +
        "            2,\n" +
        "            3\n" +
        "        ],\n" +
        "        [\n" +
        "            3,\n" +
        "            1\n" +
        "        ],\n" +
        "        [\n" +
        "            4,\n" +
        "            5\n" +
        "        ],\n" +
        "        [\n" +
        "            5,\n" +
        "            6\n" +
        "        ],\n" +
        "        [\n" +
        "            6,\n" +
        "            7\n" +
        "        ],\n" +
        "        [\n" +
        "            7,\n" +
        "            4\n" +
        "        ],\n" +
        "        [\n" +
        "            8,\n" +
        "            9\n" +
        "        ],\n" +
        "        [\n" +
        "            9,\n" +
        "            8\n" +
        "        ],\n" +
        "        [\n" +
        "            0,\n" +
        "            0\n" +
        "        ],\n" +
        "        [\n" +
        "            0,\n" +
        "            0\n" +
        "        ],\n" +
        "        [\n" +
        "            0,\n" +
        "            0\n" +
        "        ]\n" +
        "    ],\n" +
        "    \"use\": true,\n" +
        "    \"area\": 1,\n" +
        "    \"step\": 15,\n" +
        "    \"region\": 1,\n" +
        "    \"switch\": false,\n" +
        "    \"xctrls\": [\n" +
        "        {\n" +
        "            \"left\": 300,\n" +
        "            \"name\": \"Без имени_09.09.2022_09-28-28\",\n" +
        "            \"right\": 300,\n" +
        "            \"status\": [],\n" +
        "            \"StrategyA\": [\n" +
        "                {\n" +
        "                    \"pk\": 1,\n" +
        "                    \"desc\": \"\",\n" +
        "                    \"xleft\": 100,\n" +
        "                    \"xright\": 100\n" +
        "                },\n" +
        "                {\n" +
        "                    \"pk\": 2,\n" +
        "                    \"desc\": \"\",\n" +
        "                    \"xleft\": 200,\n" +
        "                    \"xright\": 200\n" +
        "                },\n" +
        "                {\n" +
        "                    \"pk\": 3,\n" +
        "                    \"desc\": \"\",\n" +
        "                    \"xleft\": 300,\n" +
        "                    \"xright\": 300\n" +
        "                }\n" +
        "            ],\n" +
        "            \"StrategyB\": [\n" +
        "                {\n" +
        "                    \"pkl\": 1,\n" +
        "                    \"pkr\": 3,\n" +
        "                    \"pks\": 2,\n" +
        "                    \"desc\": \"\",\n" +
        "                    \"vleft\": 1.2000000476837158,\n" +
        "                    \"xleft\": 100,\n" +
        "                    \"vright\": 1.399999976158142,\n" +
        "                    \"xright\": 100\n" +
        "                },\n" +
        "                {\n" +
        "                    \"pkl\": 4,\n" +
        "                    \"pkr\": 6,\n" +
        "                    \"pks\": 5,\n" +
        "                    \"desc\": \"\",\n" +
        "                    \"vleft\": 0.699999988079071,\n" +
        "                    \"xleft\": 200,\n" +
        "                    \"vright\": 1.100000023841858,\n" +
        "                    \"xright\": 200\n" +
        "                },\n" +
        "                {\n" +
        "                    \"pkl\": 7,\n" +
        "                    \"pkr\": 9,\n" +
        "                    \"pks\": 8,\n" +
        "                    \"desc\": \"\",\n" +
        "                    \"vleft\": 0.6499999761581421,\n" +
        "                    \"xleft\": 300,\n" +
        "                    \"vright\": 1.2999999523162842,\n" +
        "                    \"xright\": 300\n" +
        "                }\n" +
        "            ],\n" +
        "            \"Calculates\": [\n" +
        "                {\n" +
        "                    \"id\": 11,\n" +
        "                    \"area\": 1,\n" +
        "                    \"chanL\": [\n" +
        "                        2\n" +
        "                    ],\n" +
        "                    \"chanR\": [\n" +
        "                        3\n" +
        "                    ],\n" +
        "                    \"region\": 1\n" +
        "                }\n" +
        "            ]\n" +
        "        }\n" +
        "    ],\n" +
        "    \"yellow\": {\n" +
        "        \"make\": true,\n" +
        "        \"stop\": 120,\n" +
        "        \"start\": 0\n" +
        "    },\n" +
        "    \"release\": true,\n" +
        "    \"subarea\": 1,\n" +
        "    \"prioryty\": [\n" +
        "        [\n" +
        "            0,\n" +
        "            0,\n" +
        "            0\n" +
        "        ],\n" +
        "        [\n" +
        "            2,\n" +
        "            1,\n" +
        "            3\n" +
        "        ],\n" +
        "        [\n" +
        "            5,\n" +
        "            4,\n" +
        "            6\n" +
        "        ],\n" +
        "        [\n" +
        "            8,\n" +
        "            7,\n" +
        "            9\n" +
        "        ]\n" +
        "    ]\n" +
        "}")


    setTimeout(() => ws.send(JSON.stringify({
        "type": "getCalculation",
        "region": 1,
        "area": 3,
        "subarea": 6,
        "date": "2023-02-02T00:00:00.000Z"
    })), 3000)
    // setTimeout(() => ws.send(JSON.stringify({type: "changeXctrl", data: q})), 3000)
    // setTimeout(() => ws.send(JSON.stringify({type: "getStatistics", region: "1"})), 3000)
    // setTimeout(() => ws.send(JSON.stringify({type: "stopStatistics"})), 6000)
    // setTimeout(() => ws.send(JSON.stringify({type: "getOldStatistics", region: "3", date: new Date(2022,3,4, 12).toISOString()})), 9000)
    // setTimeout(() => ws.send(JSON.stringify({type: "getOldStatistics", region: "3", date: new Date(2022, 3, 16, 12).toISOString()})), 12000)
    // setTimeout(() => ws.send(JSON.stringify({type: "getStatisticsList", region: "1"})), 3000)

// })