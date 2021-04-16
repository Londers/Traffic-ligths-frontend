'use strict';

let IDs = [];
let areaLayout = [];
let subareasLayout = [];
let regionInfo;
let areaInfo;
let areaZone;
let boxRemember = {Y: 0, X: 0};
let boxPoint = [];
let description = '';
let tflights = [];
let currentRouteTflights = new Map();
let routeList = [];
let allRoutesList = [];
let lastRoute = {};
let circlesMap = new Map();
let zoom = 19;
let fixationFlag = false;
let creatingFlag = true;
let executionFlag = false;
let loopFuncMap = new Map();
let sendedPhaseSave = new Map();
let ws;

function getRandomColor() {
    let letters = '0123456789A';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 11)];
    }
    return color;
}

function deleteCircle(map, circle, pos, description) {
    map.geoObjects.remove(circle);
    circlesMap.delete(pos);
    routeList.forEach((route, index) => {
        if ((route.pos.region === pos.region) && (route.pos.area === pos.area) && (route.pos.id === pos.id)) routeList.splice(index, 1);
    });
    $('#table').bootstrapTable('remove', {field: 'desc', values: [description]});
    $('#navTable').bootstrapTable('remove', {field: 'tflight', values: [description]});

    makeSelects();
}

function createIdeviceArray() {
    let tflist = [];
    let idevices = [];
    let place = $('#routes').val().split('---');

    allRoutesList.forEach(route => {
        if ((route.region === place[0]) && (route.description === place[1])) {
            tflist = route.listTL;
        }
    });

    tflist.forEach(tf => {
        tflights.forEach(element => {
            if ((element.region.num === tf.pos.region) && (element.area.num === tf.pos.area) && (element.ID === tf.pos.id)) idevices.push(element.idevice);
        });
    });

    return idevices;
}

function handlePhaseCommand(map, idevice) {
    let phase = -1;
    let dataArr = $('#table').bootstrapTable('getData');
    dataArr.forEach((tf, index) => {
        if (tf.idevice === idevice) phase = Number($('#phase' + index).val())
    });

    let navTable = $('#navTable').bootstrapTable('getData');
    let index = -1;
    navTable.forEach((row, rowIndex) => {
        if (row.idevice === idevice) index = rowIndex;
    });
    if (navTable.length > (index + 1)) $($('#navTable tbody tr')[index + 1]).trigger('click');

    if (executionFlag && (phase !== -1)) {
        if (!sendedPhaseSave.get(idevice)) {
            sendedPhaseSave.set(idevice, true);
            modifiedControlSend({id: idevice, cmd: 9, param: phase});
        }
    }
}

function handleClick(map, trafficLight, diffCoords) {
    let coordinates = (diffCoords === undefined) ? [trafficLight.points.Y, trafficLight.points.X] : diffCoords;
    let region = trafficLight.region.num;
    let area = trafficLight.area.num;
    let id = trafficLight.ID;
    let idevice = trafficLight.idevice;
    let description = trafficLight.description;
    let phases = trafficLight.phases;
    let returnFlag = false;

    if (!creatingFlag) {
        // map.setCenter(coordinates, 17);
        handlePhaseCommand(map, trafficLight.idevice);
        return;
    }

    circlesMap.forEach((value, key) => {
        if ((key.region === region) && (key.area === area) && (key.id === id)) {
            deleteCircle(map, value, key, description);
            returnFlag = true;
        }
    });

    if (returnFlag) return;

    if (routeList.length > 0) {
        if (routeList[routeList.length - 1].pos.region !== region) return;
    }

    routeList.push({
        num: routeList.length,
        phase: -1,
        point: {Y: coordinates[0], X: coordinates[1]},
        pos: {region: region, area: area, id: id}
    });

    // Создаем круг.
    let myCircle = new ymaps.Circle([
        // Координаты центра круга.
        coordinates,
        // Радиус круга в метрах.
        radiusCalculate(map.getZoom())
    ], {
        // Описываем свойства круга.
        // Содержимое балуна.
        // balloonContent: "Радиус круга - 10 км",
        // Содержимое хинта.
        // hintContent: "Подвинь меня"
    }, {
        // Задаем опции круга.
        // Включаем возможность перетаскивания круга.
        draggable: false,
        // Цвет заливки.
        // Последний байт (77) определяет прозрачность.
        // Прозрачность заливки также можно задать используя опцию "fillOpacity".
        fillColor: "#DB709377",
        // Цвет обводки.
        strokeColor: "#990066",
        // Прозрачность обводки.
        strokeOpacity: 0.8,
        // Ширина обводки в пикселях.
        strokeWidth: 5
    });

    circlesMap.set({region: region, area: area, id: id, description: description}, myCircle);

    // Добавляем круг на карту.
    map.geoObjects.add(myCircle);

    //Заполнение структуры для дальнейшей записи в таблицу
    let tflight = [{
        desc: description,
        phase: phases,
        region: region,
        area: area,
        id: id,
        idevice: idevice
    }];

    $('#table').bootstrapTable('append', tflight).bootstrapTable('scrollTo', 'top');
    $('#navTable').bootstrapTable('append', {
        id: $('#navTable').bootstrapTable('getData').length + 1,
        tflight: description
    }).bootstrapTable('scrollTo', 'top');

    makeSelects();
}

function getPhases(index) {
    let rowData = $('#table').bootstrapTable('getData')[index];
    let returnData = {currPhase: -1, phases: []};

    tflights.some(trafficLight => {
        if ((trafficLight.region.num === rowData.region) && (trafficLight.area.num === rowData.area) && (trafficLight.ID === rowData.id)) {
            returnData.currPhase = (rowData.phase.length === 1) ? rowData.phase[0] : 1;
            returnData.phases = trafficLight.phases;
        }
    });

    return returnData;
}

function makeSelects() {
    $('#table tbody tr').each((i, tr) => {
        $(tr).find('td').each((j, td) => {
            if (td.cellIndex === 2) {
                let phases = getPhases(tr.rowIndex - 1);//$(this)[0].innerText.split(',');
                let selectTxt = '';
                phases.phases.forEach(phase => {
                    selectTxt += `<option value="${phase}"${((phase === phases.currPhase) ? ' selected="selected"' : '')}` +
                        `onclick="handleSelectChange(${i})">${phase}</option>>`;
                    // + ((svg.length !== 0) ? `<image xlink:href="data:image/png;base64,${(svg[i][phase-1] === undefined) ? phase : svg[i][phase-1].phase}"/>` : '')
                });
                $(td)[0].innerText = '';
                $(td)[0].innerHTML = '<select id="phase' + i + '">' + selectTxt + '</select>';
            }
        })
    })
}

function handleSelectChange(rowIndex) {
    const value = $('#phase' + rowIndex).val();
    $('#phase' + rowIndex).closest('td').next('td')[0].innerHTML = '<td>-</td>';
    if (svg[rowIndex] === undefined) {
        setTimeout(() => handleSelectChange(rowIndex), 1000);
        return;
    }
    svg[rowIndex].forEach(pic => {
        if (pic.num === value) $('#phase' + rowIndex).closest('td').next('td')[0].innerHTML =
            `<td>` +
            `<svg width="100%" height="100%"` +
            `style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;" xmlns="http://www.w3.org/2000/svg"` +
            `xmlns:xlink="http://www.w3.org/1999/xlink">` +
            `<image x="0" y="0" width="100%" height="100%"` +
            `style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;"` +
            `xlink:href="data:image/png;base64,${pic.phase}"></image>` +
            `</svg>` +
            `</td>`
    })

    // todo Жду обновлённые картинки от Андрея
    // const value = $('#phase' + rowIndex).val();
    // $('#phase' + rowIndex).closest('td').next('td')[0].innerHTML = '<td>-</td>';
    // svg[rowIndex].forEach(pic => {
    //     if (pic._num === value) $('#phase' + rowIndex).closest('td').next('td')[0].innerHTML =
    //         `<td>` +
    //             `<svg width="100%" height="100%"` +
    //             `style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;" xmlns="http://www.w3.org/2000/svg"` +
    //             `xmlns:xlink="http://www.w3.org/1999/xlink">` +
    //                 `<image x="0" y="0" width="100%" height="100%"` +
    //                 `style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;"` +
    //                 `xlink:href="data:image/png;base64,${pic.__text}"></image>` +
    //             `</svg>` +
    //         `</td>`
    // })
}

function fillPhases() {
    if (routeList.length === 0) return;
    let selects = $('#table').find('select');

    routeList.map((route, index) => route.phase = Number(selects[index].selectedOptions[0].innerText));

    ws.send(JSON.stringify({
        type: 'createRoute',
        region: routeList[0].pos.region,
        description: description,
        listTL: routeList
    }))
}

function radiusCalculate(zoom) {
    switch (zoom) {
        case 3:
            return 32000;
        case 4:
            return 16000;
        case 5:
            return 8000;
        case 6:
            return 4000;
        case 7:
            return 2000;
        case 8:
            return 1000;
        case 9:
            return 750;
        case 10:
            return 500;
        case 11:
            return 400;
        case 12:
            return 300;
        case 13:
            return 250;
        case 14:
            return 200;
        case 15:
            return 150;
        case 16:
            return 100;
        case 17:
            return 75;
        case 18:
            return 50;
        case 19:
            return 40;
        default:
            return 30;
    }
}

function circlesControl(map) {
    if (zoom !== map.getZoom()) {
        circlesMap.forEach(circle => {
            map.geoObjects.remove(circle);
        });
        circlesMap.forEach(circle => {
            circle.geometry.setRadius(radiusCalculate(map.getZoom()));
            map.geoObjects.add(circle);
        });
        zoom = map.getZoom();
    }
}

function setRouteArea(map, box, description, routeId) {
    map.geoObjects.remove(lastRoute);
    let coordinates = [];
    let tableData = [];
    let navTableData = [];
    allRoutesList[routeId].listTL.forEach((tf, index) => {
        coordinates.push([tf.point.Y, tf.point.X]);
        tableData.push({
            desc: tf.description,
            phase: [tf.phase],
            region: tf.pos.region,
            area: tf.pos.area,
            id: tf.pos.id,
            idevice: findIdevice(tf.pos.region, tf.pos.area, tf.pos.id)
        });
        navTableData.push({
            id: index + 1,
            tflight: tf.description,
            idevice: findIdevice(tf.pos.region, tf.pos.area, tf.pos.id)
        });
    });

    // Построение маршрута.
    // По умолчанию строится автомобильный маршрут.
    let multiRoute = new ymaps.multiRouter.MultiRoute({
        // Точки маршрута. Точки могут быть заданы как координатами, так и адресом.
        referencePoints: coordinates
    }, {
        // Автоматически устанавливать границы карты так,
        // чтобы маршрут был виден целиком.
        boundsAutoApply: true
    });

    lastRoute = multiRoute;
    map.geoObjects.add(multiRoute);


    tableData.forEach(row => {
        $.ajax({
            url: window.location.origin + '/file/static/cross/' + row.region + '/' + row.area + '/' + row.id + '/cross.svg',
            type: 'GET',
            success: function (svgData) {
                // todo Жду обновлённые картинки от Андрея
                // let x2js = new X2JS();
                // let data = x2js.xml2json(svgData);
                // svg.push(data.svg.mphase.phase)

                $('body').append('<img id="kostil" class="img-fluid" src="" style="display: none" alt="Перекрёсток">');
                $('#kostil').prepend(svgData.children[0].outerHTML.replace('let currentPhase', 'var currentPhase'));

                if (typeof getPhasesMass === "function") {
                    let phases = getPhasesMass();
                    svg.push(phases)
                } else {
                    svg.push([]);
                }

                $('#kostil').remove();
            },
            error: function (request) {
                console.log(request.status + ' ' + request.responseText);
            }
        });
    });

    $('#table').bootstrapTable('load', tableData);
    $('#navTable').bootstrapTable('load', navTableData);
    makeSelects();
    $('#table tbody tr td').each((i, td) => {
        $(td).find('select option[selected=selected]').trigger('click');
    })
}

let svg = [];

function findIndex(hintContent) {
    if ($('#tableCol')[0].style.display === 'none') return -1;

    let id = -1;
    $('#navTable tbody tr').each((i, tr) => {
        if (tr.cells[3].innerText.replace(/\s/g, "") === hintContent.replace(/\s/g, "")) id = i;
    });
    return id;
}

function getStatus(position) {
    let currPhase = -1;
    tflights.forEach(element => {
        if ((element.region.num === position.region) && (element.area.num === position.area) && (element.ID === position.id)) {
            currPhase = element.tlsost.num;
        }
    });
    return currPhase;
}

function distanceBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt((Math.pow((x2 - x1), 2) + (Math.pow((y2 - y1), 2))));
}

function findClosestTFLight(coords) {
    let closestTFLight = undefined;
    let x1 = coords[1];
    let y1 = coords[0];
    let minDistance = 0;
    tflights.forEach(tflight => {
        let x2 = tflight.points.X;
        let y2 = tflight.points.Y;
        let distance = distanceBetweenPoints(x1, y1, x2, y2);
        if ((minDistance === 0) || minDistance > distance) {
            minDistance = distance;
            closestTFLight = tflight;
        }
    });
    console.log(minDistance);
    return closestTFLight;
}

ymaps.ready(function () {

    $('#tableCol').hide();
    $('#deleteRouteButton').hide();
    $('#updateRouteButton').hide();
    $('#startRouteButton').hide();
    $('#endRouteButton').hide();

    //Создание и первичная настройка карты
    let map = new ymaps.Map('map', {
        center: [54.9912, 73.3685],
        zoom: 19
    });

    map.events.add(['click'], function (evt) {
        let coords = evt.getSourceEvent().get('coords');
        handleClick(map, findClosestTFLight(coords), coords);
    });

    map.events.add(['wheel', 'mousemove', 'click'], function () {
        circlesControl(map);
    });

    $('#map').on('mousedown', function (evt) {
        if (evt.which === 3) {
            let sended = false;
            sendedPhaseSave.forEach((value, key) => {
                if (value && !sended) {
                    sendedPhaseSave.set(key, false);
                    modifiedControlSend({id: key, cmd: 9, param: 9});
                    sended = true;
                }
            })
        }
    });

    $('#dropdownLayersButton').trigger('click');
    $('#dropdownControlButton').trigger('click');

    //Выбор места для открытия на карте
    $('#locationButton').on('click', function () {
        $('#locationDialog').dialog('open');
    });

    $('#phaseTableButton').on('click', function () {
        $('#phaseTableDialog').dialog('open');
    });

    $('#deleteButton').on('click', function () {
        if (confirm('Вы уверены? Маршрут будет безвозвратно удалён.')) {
            let selected = $('#table').bootstrapTable('getSelections')[0];
            let place = $('#routes').val().split('---');
            allRoutesList.forEach((route, index) => {
                if ((route.region === place[0]) && (route.description === place[1])) {
                    route.listTL.forEach((tf, index) => {
                        if ((tf.pos.region === selected.region) && (tf.pos.area === selected.area) && (tf.pos.id === selected.id)) route.listTL.splice(index, 1);
                    })
                }
                setRouteArea(map, route.box, route.description, index);
            });
            $('#table').bootstrapTable('remove', {field: 'state', values: [true]});
        }
    });

    $('#fixationButton').on('click', function () {
        if (fixationFlag) {
            map.setBounds(boxRemember);
        } else {
            boxRemember = map.getBounds();
            $('#fixationButton')[0].innerText = 'Вернуться';
            fixationFlag = true;
        }
    });

    $('#fixationReset').on('click', function () {
        fixationFlag = false;
        $('#fixationButton')[0].innerText = 'Зафиксировать экран';
    });

    $('#switchSubLayout').on('change', function () {
        if ($('#switchSubLayout').prop('checked')) {
            if (subareasLayout.length === 0) createSubareasLayout(map);
        } else {
            if (subareasLayout.length !== 0) deleteSubareasLayout(map);
        }
    });

    $('#switchLayout').on('change', function () {
        if ($('#switchLayout').prop('checked')) {
            if (areaLayout.length === 0) createAreasLayout(map);
        } else {
            if (areaLayout.length !== 0) deleteAreasLayout(map);
        }
    });

    $('#sendRouteButton').on('click', function () {
        $('#routeDesc').val('');
        $('#newRouteDialog').dialog('open');
    });

    $('#updateRouteButton').on('click', function () {
        let place = $('#routes').val().split('---');
        let currRoute = {};
        allRoutesList.forEach(route => {
            if ((route.region === place[0]) && (route.description === place[1])) {
                currRoute = route;
            }
        });

        currRoute.listTL.map((tl, index) => tl.phase = Number($('#phase' + index).val()));

        ws.send(JSON.stringify({
            type: 'updateRoute',
            description: currRoute.description,
            region: currRoute.region,
            listTL: currRoute.listTL
        }))
    });

    $('#deleteRouteButton').on('click', function () {
        let place = $('#routes').val().split('---');
        allRoutesList.forEach(route => {
            if ((route.region === place[0]) && (route.description === place[1])) {
                ws.send(JSON.stringify({type: 'deleteRoute', region: route.region, description: route.description}));
            }
        })
    });

    $('#startRouteButton').on('click', function () {
        $(this).hide();
        $('#routes')[0].disabled = true;
        executionFlag = true;
        $('#deleteRouteButton').hide();
        $('#updateRouteButton').hide();
        $('#endRouteButton').show();
        $($('#navTable tbody tr')[0]).trigger('click');
        ws.send(JSON.stringify({type: 'route', devices: createIdeviceArray(), turnOn: true}));
    });

    $('#endRouteButton').on('click', function () {
        $(this).hide();
        $('#routes')[0].disabled = false;
        executionFlag = false;
        $('#deleteRouteButton').show();
        $('#updateRouteButton').show();
        $('#startRouteButton').show();
        ws.send(JSON.stringify({type: 'route', devices: [], turnOn: false}));
    });

    $('#routes').on('change', function () {
        let place = $('#routes').val().split('---');
        $('#endRouteButton').hide();
        sendedPhaseSave = new Map();
        svg = [];
        if ((place[0] === '0') && (place[1] === '0')) {
            $('#tableCol').hide();
            $('#startRouteButton').hide();
            $('#deleteRouteButton').hide();
            $('#updateRouteButton').hide();
            $('#sendRouteButton').show();
            map.geoObjects.remove(lastRoute);
            map.setBounds([
                [boxPoint.point0.Y, boxPoint.point0.X],
                [boxPoint.point1.Y, boxPoint.point1.X]
            ]);
            $('#table').bootstrapTable('removeAll');
            $('#navTable').bootstrapTable('removeAll');
            creatingFlag = true;
            return;
        }

        $('#tableCol').show();

        allRoutesList.forEach((route, index) => {
            if ((route.region === place[0]) && (route.description === place[1])) {
                currentRouteTflights = new Map();
                setRouteArea(map, route.box, route.description, index);
                map.geoObjects.each(object => {
                    if (object.geometry) {
                        if (route.listTL.some(tl => (JSON.stringify(tl.pos) === JSON.stringify(object.pos)))) {
                            currentRouteTflights.set(findIndex(object.properties._data.hintContent), object);
                        }
                    }
                });
                currentRouteTflights = new Map([...currentRouteTflights.entries()].sort());
                $('#navTable tbody tr').each((i, tr) => {
                    $(tr).on('click', () => {
                        map.setCenter(currentRouteTflights.get(tr.rowIndex - 1).geometry.getCoordinates(), 17);
                    });
                    tr.cells[1].innerHTML = '<div class="placemark"  style="background-image:url(\'' + location.origin +
                        '/free/img/trafficLights/' + getStatus(route.listTL[i].pos) + '.svg\');' +
                        'background-repeat: no-repeat; background-size: 50%; min-height: 50px;"></div>';
                });
            }
        });


        $('#sendRouteButton').hide();
        $('#updateRouteButton').show();
        $('#deleteRouteButton').show();
        $('#startRouteButton').show();
        // routeStartFlag = true;
        creatingFlag = false;
    });

    ws = new WebSocket('wss://' + location.host + location.pathname + 'W');

    ws.onerror = function (evt) {
        console.log('WebSocket error:', evt);
    };

    ws.onopen = function () {
        // on connecting, do nothing but log it to the console
        console.log('connected')
    };

    //Функция для обновления статусов контроллеров в реальном времени
    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        console.log(data);
        // localStorage.setItem("maintab", "closed");
        switch (allData.type) {
            case 'mapInfo':
                allRoutesList = data.routes;
                regionInfo = data.regionInfo;
                areaInfo = data.areaInfo;
                tflights = data.tflight;
                if ((areaZone === undefined) && (data.areaZone !== undefined)) {
                    areaZone = data.areaZone;
                    createAreasLayout(map);
                }
                // convexHullTry(map, data.hull);
                //Заполнение поля выбора регионов для перемещения
                for (let reg in regionInfo) {
                    $('#region').append(new Option(regionInfo[reg], reg));
                }
                fillAreas($('#area'), $('#region'), areaInfo);

                // map.controls.remove('searchControl');

                $('#regionForm').on('change', function () {
                    fillAreas($('#area'), $('#region'), areaInfo);
                });

                boxPoint = data.boxPoint;
                map.setBounds([
                    [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                    [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                ]);

                //Разбор полученной от сервера информации
                data.tflight.forEach(trafficLight => {
                    IDs.push(trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID);
                    //Создание меток контроллеров на карте
                    let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                        hintContent: trafficLight.description
                    }, {
                        iconLayout: createChipsLayout(function (zoom) {
                            // Размер метки будет определяться функией с оператором switch.
                            return calculate(zoom);
                        }, trafficLight.tlsost.num),
                    });
                    placemark.pos = {region: trafficLight.region.num, area: trafficLight.area.num, id: trafficLight.ID};
                    //Функция для вызова АРМ нажатием на контроллер
                    placemark.events.add('click', function () {
                        handleClick(map, trafficLight);
                    });
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);
                });

                data.routes.forEach(route => {
                    $('#routes').append(new Option(route.description, route.region + '---' + route.description));
                });
                // .append(new Option(regionInfo[reg], reg));
                break;
            case 'tflight':
                if (data.tflight === null) {
                    console.log('null');
                } else {
                    console.log('Обновление');
                    //Обновление статуса контроллера происходит только при его изменении
                    data.tflight.forEach(trafficLight => {
                        let id = trafficLight.ID;
                        let index = IDs.indexOf(trafficLight.region.num + '-' + trafficLight.area.num + '-' + id);
                        let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                            hintContent: trafficLight.description
                        }, {
                            iconLayout: createChipsLayout(function (zoom) {
                                // Размер метки будет определяться функией с оператором switch.
                                return calculate(zoom);
                            }, trafficLight.tlsost.num)
                        });
                        placemark.events.add('click', function () {
                            handleClick(map, trafficLight);
                        });
                        //Замена метки контроллера со старым состоянием на метку с новым
                        map.geoObjects.splice(index, 1, placemark);

                        tflights.forEach((tflight, index) => {
                            if ((tflight.region.num === trafficLight.region.num) &&
                                (tflight.area.num === trafficLight.area.num) && (tflight.ID === trafficLight.ID)) {
                                tflights[index].tlsost = trafficLight.tlsost;
                            }
                        });

                        let tableIndex = findIndex(trafficLight.description);
                        if (tableIndex !== -1) {
                            $('#navTable tbody tr').each((i, tr) => {
                                if (i === tableIndex) {
                                    tr.cells[1].innerHTML = '<div class="placemark"  style="background-image:url(\'' + location.origin +
                                        '/free/img/trafficLights/' + trafficLight.tlsost.num + '.svg\');' +
                                        'background-repeat: no-repeat; background-size: 50%; min-height: 50px;"></div>';
                                }
                            });
                        }
                    })
                }
                break;
            case 'repaint':
                let execWaiter = setInterval(() => {
                    if (!executionFlag) {
                        map.geoObjects.removeAll();
                        //Разбор полученной от сервера информации
                        data.tflight.forEach(trafficLight => {
                            IDs.push(trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID);
                            //Создание меток контроллеров на карте
                            let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                                hintContent: trafficLight.description
                            }, {
                                iconLayout: createChipsLayout(function (zoom) {
                                    // Размер метки будет определяться функией с оператором switch.
                                    return calculate(zoom);
                                }, trafficLight.tlsost.num),
                            });
                            placemark.pos = {
                                region: trafficLight.region.num,
                                area: trafficLight.area.num,
                                id: trafficLight.ID
                            };
                            //Функция для вызова АРМ нажатием на контроллер
                            placemark.events.add('click', function () {
                                handleClick(map, trafficLight);
                            });
                            //Добавление метки контроллера на карту
                            map.geoObjects.add(placemark);
                        });
                        areaZone = data.areaZone;
                        createAreasLayout(map);
                        clearInterval(execWaiter);
                    }
                }, 5000);
                break;
            case 'jump':
                map.setBounds([
                    [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                    [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                ]);
                break;
            case 'phases':
                // let arr = [{idevice: 159519, phase: 2}];
                const tableData = $('#navTable').bootstrapTable('getData');
                tableData.forEach((row, rowIndex) => {
                    data.phases.forEach(phaseRow => {
                        if (phaseRow.device === row.idevice) {
                            $('#navTable tbody tr')[rowIndex].cells[2].innerHTML =
                                (phaseRow.phase === 9) ? 'Пром. такт' :
                                    ((svg[rowIndex][phaseRow.phase - 1]) === undefined) ? 'Отсуствует картинка фазы' :
                                        `<svg width="100%" height="100%"` +
                                        `style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;" xmlns="http://www.w3.org/2000/svg"` +
                                        `xmlns:xlink="http://www.w3.org/1999/xlink">` +
                                        `<image x="0" y="0" width="100%" height="100%"` +
                                        `style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;"` +
                                        `xlink:href="data:image/png;base64,${svg[rowIndex][phaseRow.phase - 1].phase}"></image>` +
                                        `</svg>`
                        }
                    })
                });
                break;
            case 'createRoute':
                if (data.error) {
                    alert(data.error);
                    return;
                }
                allRoutesList.push(data.route);
                $('#routes').append(new Option(data.route.description, data.route.region + '---' + data.route.description));

                if (data.login === localStorage.getItem('login')) {
                    $('#routes option[value=' + data.route.region + '---' + data.route.description + ']').attr('selected', 'selected');
                    $('#routes').change();

                    circlesMap.forEach((value, key) => {
                        map.geoObjects.remove(value);
                        circlesMap.delete(key);
                    });

                    // setRouteArea(map, data.route.box, data.route.description, allRoutesList.length - 1);
                    //
                    // $('#sendRouteButton').hide();
                    // $('#tableCol').show();
                    // $('#updateRouteButton').show();
                    // $('#deleteRouteButton').show();
                    // $('#startRouteButton').show();
                    creatingFlag = false;
                }
                break;
            case 'deleteRoute':
                $("#routes option[value='" + data.route.region + '---' + data.route.description + "']").remove();
                map.geoObjects.remove(lastRoute);
                map.setBounds([
                    [boxPoint.point0.Y, boxPoint.point0.X],
                    [boxPoint.point1.Y, boxPoint.point1.X]
                ]);
                $('#table').bootstrapTable('removeAll');
                $('#navTable').bootstrapTable('removeAll');
                $('#tableCol').hide();
                $('#routes').change();
                routeList = [];
                break;
            case 'close':
                // if (editFlag) controlSend({id: idevice, cmd: 4, param: 0});
                ws.close();
                // if (data.message !== '') {
                //     if (!document.hidden) alert(data.message);
                // } else {
                //     if (!document.hidden) alert('Потеряна связь с сервером');
                // }
                window.close();
                break;
            case 'error':
                console.log('Error', allData);
                break;
        }
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
    };

    //Всплывающее окно для создания пользователя /locationButton
    $('#locationDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                //Проверка корректности введённых данных
                if (($('#area option:selected').text() === '')) {
                    if (!($('#areasMsg').length) && ($('#area option:selected').text() === '')) {
                        $('#areasForm').append('<div style="color: red;" id="areasMsg"><h5>Выберите районы</h5></div>');
                    }
                    return;
                }
                let selectedAreas = $('#area option:selected').toArray().map(item => item.value);

                //Сбор данных для отправки на сервер
                let toSend = {
                    type: 'jump',
                    region: $('#region option:selected').val(),
                    area: selectedAreas
                };
                //Отправка данных на сервер
                ws.send(JSON.stringify(toSend));

                $(this).dialog('close');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false,
        close: function () {
            $('#areasMsg').remove();
        }
    });

    $('#phaseTableDialog').dialog({
        autoOpen: false,
        buttons: {
            'Ок': function () {
                $(this).dialog('close');
            }
            // 'Отмена': function () {
            //     $(this).dialog('close');
            // }
        },
        minWidth: 1000,
        modal: true,
        resizable: false
    });

    $('#newRouteDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                description = $('#routeDesc').val();
                fillPhases();
                $(this).dialog('close');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false,
        close: function () {
            $('#areasMsg').remove();
        }
    });
});

function findIdevice(region, area, id) {
    let idevice = -1;
    tflights.forEach(tf => {
        if ((tf.region.num === region) && (tf.area.num === area) && (tf.ID === id)) idevice = tf.idevice
    });
    return idevice;
}

let createChipsLayout = function (calculateSize, currnum) {
    if (currnum === 0) {
        console.log('Возвращен несуществующий статус');
        return null;
    }
    // Создадим макет метки.
    let Chips = ymaps.templateLayoutFactory.createClass(
        '<div class="placemark"  style="background-image:url(\'' + location.origin + '/free/img/trafficLights/' + currnum + '.svg\'); background-size: 100%"></div>', {
            build: function () {
                Chips.superclass.build.call(this);
                let map = this.getData().geoObject.getMap();
                if (!this.inited) {
                    this.inited = true;
                    // Получим текущий уровень зума.
                    let zoom = map.getZoom();
                    // Подпишемся на событие изменения области просмотра карты.
                    map.events.add('boundschange', function () {
                        // Запустим перестраивание макета при изменении уровня зума.
                        let currentZoom = map.getZoom();
                        if (currentZoom !== zoom) {
                            zoom = currentZoom;
                            this.rebuild();
                        }
                    }, this);
                }
                let options = this.getData().options,
                    // Получим размер метки в зависимости от уровня зума.
                    size = calculateSize(map.getZoom()),
                    element = this.getParentElement().getElementsByClassName('placemark')[0],
                    // По умолчанию при задании своего HTML макета фигура активной области не задается,
                    // и её нужно задать самостоятельно.
                    // Создадим фигуру активной области "Круг".
                    circleShape = {
                        type: 'Circle',
                        coordinates: [0, 0],
                        radius: size / 2
                    };
                // Зададим высоту и ширину метки.
                element.style.width = element.style.height = size + 'px';
                // Зададим смещение.
                element.style.marginLeft = element.style.marginTop = -size / 2 + 'px';
                // Зададим фигуру активной области.
                options.set('shape', circleShape);
            }
        }
    );
    return Chips;
};

//Мастшабирование иконов светофороф на карте
let calculate = function (zoom) {
    switch (zoom) {
        // case 11:
        //     return 5;
        // case 12:
        //     return 10;
        // case 13:
        //     return 20;
        case 14:
            return 30;
        case 15:
            return 35;
        case 16:
            return 50;
        case 17:
            return 60;
        case 18:
            return 80;
        case 19:
            return 130;
        default:
            return 20;
        // return 80;
    }
};

function createAreasLayout(map) {
    if (!$('#switchLayout').prop('checked')) return;
    areaZone.forEach(area => {
        let polygon = convexHullTry(map, area.zone, 'Регион: ' + area.region + ', Район: ' + area.area);
        areaLayout.push(polygon);
    })
}

function deleteAreasLayout(map) {
    areaLayout.forEach(layout => map.geoObjects.remove(layout));
    areaLayout = [];
}

function createSubareasLayout(map) {
    if (!$('#switchSubLayout').prop('checked')) return;
    areaZone.forEach(area => {
        area.sub.forEach(sub => {
            let polygon = convexHullTry(map, sub.zone, 'Регион: ' + area.region + ', Район: ' + area.area + ', Подрайон:' + sub.subArea);
            subareasLayout.push(polygon);
        })
    })
}

function deleteSubareasLayout(map) {
    subareasLayout.forEach(layout => {
        map.geoObjects.remove(layout);
    });
    subareasLayout = [];
}

function convexHullTry(map, coordinates, description) {
    let color = getRandomColor();

    // Создаем многоугольник, используя вспомогательный класс Polygon.
    var myPolygon = new ymaps.Polygon([
        // Указываем координаты вершин многоугольника.
        // Координаты вершин внешнего контура.
        coordinates.map(point => [point.Y, point.X]),
        // Координаты вершин внутреннего контура.
        [
            [0, 0]
        ]
    ], {
        // Описываем свойства геообъекта.
        // Содержимое балуна.
        hintContent: description
    }, {
        // Задаем опции геообъекта.
        // Цвет заливки.
        fillColor: color,
        fillOpacity: 0.1,
        // Ширина обводки.
        strokeWidth: 5
    });

    // Добавляем многоугольник на карту.
    map.geoObjects.add(myPolygon);
    return myPolygon;
}

//Заполнение поля выбора районов для создания или изменения пользователя
function fillAreas($area, $region, areaInfo) {
    $area.empty();
    for (let regAreaJson in areaInfo) {
        for (let areaJson in areaInfo[regAreaJson]) {
            if (regAreaJson === $region.find(':selected').text()) {
                $area.append(new Option(areaInfo[regAreaJson][areaJson], areaJson));
            }
        }
    }
}

function modifiedControlSend(toSend) {
    let loopFunc;
    if (loopFuncMap.get(toSend.id)) {
        clearInterval(loopFuncMap.get(toSend.id));
        loopFuncMap.set(toSend.id, undefined)
    }

    controlSend(toSend);

    if (toSend.param !== 9) {
        loopFunc = window.setInterval(function () {
            controlSend(toSend);
        }, 60000);
        loopFuncMap.set(toSend.id, loopFunc);
    }
}

//Отправка выбранной команды на сервер
function controlSend(toSend) {
    ws.send(JSON.stringify({type: 'dispatch', id: toSend.id, cmd: toSend.cmd, param: toSend.param}));
}