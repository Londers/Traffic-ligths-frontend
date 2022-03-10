'use strict'

let IDs = [];
let ws = undefined;
let map = undefined;
let waiter = undefined;

let boxRemember = {Y: 0, X: 0};
let coordsSave = [];
let fixationFlag = false;
let fragments = [];
let tflights = [];
let routeTFLights = [];
let zoom = 19
let ideviceSave = -1;

let creatingMode = false;
let executionFlag = false;

class tfLink {
    constructor() {
        this.west = new cardinalPoint();
        this.north = new cardinalPoint();
        this.east = new cardinalPoint();
        this.south = new cardinalPoint();
        this.add1 = new cardinalPoint();
        this.add2 = new cardinalPoint();
    }

    copy(tfl) {
        this.west = new cardinalPoint(tfl.west);
        this.north = new cardinalPoint(tfl.north);
        this.east = new cardinalPoint(tfl.east);
        this.south = new cardinalPoint(tfl.south);
        this.add1 = new cardinalPoint(tfl.add1);
        this.add2 = new cardinalPoint(tfl.add2);
    }

    set West(value) {
        this.west = value;
    }

    get West() {
        return this.west;
    }

    set North(value) {
        this.north = value;
    }

    get North() {
        return this.north;
    }

    set East(value) {
        this.east = value;
    }

    get East() {
        return this.east;
    }

    set South(value) {
        this.south = value;
    }

    get South() {
        return this.south;
    }

    set Add1(value) {
        this.add1 = value;
    }

    get Add1() {
        return this.add1;
    }

    set Add2(value) {
        this.add2 = value;
    }

    get Add2() {
        return this.add2;
    }
}

class cardinalPoint {
    constructor(struct) {
        if (struct === undefined) return;
        this.wayPointsArray = [];
        if (struct.wayPointsArray ?? false) {
            struct.wayPointsArray.forEach(wp => this.wayPointsArray.push(new wayPoint(wp.id, wp.phase)))
        }
        this.id = struct.id;
    }

    set Id(value) {
        this.id = value;
    }

    get Id() {
        return this.id;
    }

    set WayPointsArray(value) {
        this.wayPointsArray = value;
    }

    get WayPointsArray() {
        return this.wayPointsArray;
    }

    getPhaseToObj(obj) {
        return this.wayPointsArray?.find(wp => wp.Id === obj)?.phase;
    }
}

class wayPoint {
    constructor(id, phase) {
        this.id = id;
        this.phase = phase;
    }

    set Id(value) {
        this.id = value;
    }

    get Id() {
        return this.id;
    }

    set Phase(value) {
        this.phase = value;
    }

    get Phase() {
        return this.phase;
    }
}

class LinkedList {
    constructor() {
        this.nodes = [];
    }

    get size() {
        return this.nodes.length;
    }

    get head() {
        return this.size ? this.nodes[0] : null;
    }

    get tail() {
        return this.size ? this.nodes[this.size - 1] : null;
    }

    insertAt(index, value) {
        const previousNode = this.nodes[index - 1] || null;
        const nextNode = this.nodes[index] || null;
        const node = {value, next: nextNode};

        if (previousNode) previousNode.next = node;
        this.nodes.splice(index, 0, node);
    }

    insertFirst(value) {
        this.insertAt(0, value);
    }

    insertLast(value) {
        this.insertAt(this.size, value);
    }

    getAt(index) {
        return this.nodes[index];
    }

    removeAt(index) {
        const previousNode = this.nodes[index - 1];
        const nextNode = this.nodes[index + 1] || null;

        if (previousNode) previousNode.next = nextNode;

        return this.nodes.splice(index, 1);
    }

    clear() {
        this.nodes = [];
    }

    reverse() {
        this.nodes = this.nodes.reduce(
            (acc, {value}) => [{value, next: acc[0] || null}, ...acc],
            []
        );
    }

    * [Symbol.iterator]() {
        yield* this.nodes;
    }
}

let currentTfId = '';
let currentTfLink = new tfLink();
let addObjectsArray = [];
let tfLinksArray = [];
let routeList = [];
let circlesMap = new Map();
let svg = {};

$(() => {
    $('#tableCol').parent().prepend('<div class="col-md-9 border border-dark" id="map" ' +
        `style="min-height: ${window.innerHeight}px; max-width: ${window.innerWidth}px; position: relative; z-index: 1"></div>`
    )
})

// Извлечение уникальной связки region-area-id
function getUniqueId(trafficLight) {
    return trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID;
}

function getPhase(from, curr, to) {
    return Object.values(tfLinksArray.find(tfl => tfl.id === curr).tflink).find(cp => cp.Id === from).getPhaseToObj(to);
}


function createCircle(region, area, id, description, coordinates) {
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
        hintContent: description
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

    circlesMap.set(JSON.stringify({region: region, area: area, id: id, description: description}), myCircle);
    if (circlesMap.size > 2) $('#startRouteButton')[0].hidden = false
    // Добавляем круг на карту.
    map.geoObjects.add(myCircle);
}

function deleteCircle(map, circle, pos, description) {
    map.geoObjects.remove(circle);
    circlesMap.delete(JSON.stringify(pos));
    routeList.forEach((route, index) => {
        if ((route.pos.region === pos.region) && (route.pos.area === pos.area) && (route.pos.id === pos.id)) routeList.splice(index, 1);
    });
    $('#table').bootstrapTable('remove', {field: 'desc', values: [description]});
    $('#navTable').bootstrapTable('remove', {field: 'tflight', values: [description]});

    makeSelects();

    if (circlesMap.size === 0) $('#startRouteButton')[0].hidden = true
}

function deleteAllCircles() {
    circlesMap.forEach((value, key) => {
        map.geoObjects.remove(value);
        circlesMap.delete(key);
    });
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
                let phases = getPhases(tr.rowIndex - 1); // $(this)[0].innerText.split(',');
                let optionsHtml = '';
                phases.phases.forEach(phase => {
                    optionsHtml +=
                        `<option value="${phase}" ${((phase === phases.currPhase) ? ' selected="selected"' : '')}>${phase}</option>`;
                });
                $(td)[0].innerHTML = `<select id="cross${i}">${optionsHtml}</select>`;
            }
        })
    })
}

const sendPhasesMap = new LinkedList();

function fillTFLightsTable() {
    const tableContent = [];
    routeTFLights.forEach((tfl, index) => {
        if ((index !== 0) && (index < (routeTFLights.length - 1))) {
            tableContent.push({
                id: index + 1,
                status: tfl.tlsost.num,
                tflight: tfl.description,
                idevice: tfl.idevice,
            });
        }
        sendPhasesMap.insertFirst({id: getUniqueId(tfl), phase: -1})
    })

    // sendPhasesMap.forEach()

    // Object.keys(sendPhasesMap).forEach((id, index) => {
    //     if ((index > 0) && (index < (sendPhasesMap.size - 1))) {
    //         sendPhasesMap[id] = getPhase(Object.keys(sendPhasesMap)[index - 1], id, Object.keys(sendPhasesMap)[index + 1])
    //     }
    // })

    console.log(sendPhasesMap)

    $('#navTable').bootstrapTable('load', tableContent)
}

ymaps.ready(function () {
    $('#controlModeButton')[0].disabled = true;
    $('#startRouteButton')[0].hidden = true
    $('#endRouteButton')[0].hidden = true

    $('#startRouteButton').on('click', () => {
        executionFlag = true
        $('#endRouteButton')[0].hidden = !$('#endRouteButton')[0].hidden
        $('#startRouteButton')[0].hidden = true
        deleteAllCircles();
        fillTFLightsTable()
    })

    $('#endRouteButton').on('click', () => {
        executionFlag = false
        $('#endRouteButton')[0].hidden = true
        $('#startRouteButton')[0].hidden = false
    })

    // $('#phaseTableDialog').find('div.fixed-table-body').css('max-height', window.innerHeight * 0.8)
    $('[class~=no-records-found] td').text('Записей не найдено');

    const mapSettings = JSON.parse(localStorage.getItem('mapSettings'));
    zoom = mapSettings.zoom

    if ((localStorage.getItem('fragment') ?? '') !== '') {
        mapSettings.bounds = JSON.parse(localStorage.getItem('fragment'));
        localStorage.setItem('fragment', '');
    }
    //Создание и первичная настройка карты
    map = new ymaps.Map('map', {
        bounds: mapSettings.bounds,
        zoom: mapSettings.zoom,
    });

    map.events.add('click', function (evt) {
        if (!creatingMode) return;
        coordsSave = evt.get('coords');
        $('#creatingAddDialog').dialog('open');
        $('#creatingAddDialog input').val('')
    });

    map.events.add(['wheel', 'mousemove', 'click'], function () {
        circlesControl(map);
    });

    $('#dropdownControlButton').trigger('click');

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

    $('#createModeButton').on('click', function () {
        creatingMode = true;
        $('#controlModeButton')[0].disabled = false;
        $('#createModeButton')[0].disabled = true;
        $('.col-md-9').removeClass('col-md-9').addClass('col-md-12')
        map.container.fitToViewport()
    });

    $('#controlModeButton').on('click', function () {
        creatingMode = false;
        $('#controlModeButton')[0].disabled = true;
        $('#createModeButton')[0].disabled = false;
        $('.col-md-12').removeClass('col-md-12').addClass('col-md-9')
        map.container.fitToViewport()
    });

    let closeReason = '';
    ws = new WebSocket('wss://' + location.host + location.pathname + 'W');

    ws.onopen = function () {
        // on connecting, do nothing but log it to the console
        console.log('connected')
        ws.send(JSON.stringify({type: 'getBindings'}));
        ws.send(JSON.stringify({type: 'getAddObjects'}));
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
        alert('Ошибка соединения: ' + closeReason);
    };

    ws.onerror = function (evt) {
        alert(`Ошибка соединения WebSocket, ${evt.reason}`);
    }


    //Функция для обновления статусов контроллеров в реальном времени
    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        // console.log(data);
        // localStorage.setItem("maintab", "closed");
        switch (allData.type) {
            case 'mapInfo':
                fragments = data.fragments;
                tflights = data.tflight;
                //Заполнение поля выбора регионов для перемещения
                for (let reg in data.regionInfo) {
                    $('#region').append(new Option(data.regionInfo[reg], reg));
                    $('#addRegion').append(new Option(data.regionInfo[reg], reg));
                }
                fillAreas($('#area'), $('#region'), data.areaInfo);
                fillAreas($('#addArea'), $('#addRegion'), data.areaInfo);

                $('#regionForm').on('change', function () {
                    fillAreas($('#area'), $('#region'), data.areaInfo);
                });
                $('#addRegion').on('change', function () {
                    fillAreas($('#addArea'), $('#addRegion'), data.areaInfo);
                });

                //Разбор полученной от сервера информации
                data.tflight.forEach(trafficLight => {
                    IDs.push(getUniqueId(trafficLight));
                    //Создание меток контроллеров на карте
                    let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                        // balloonContentHeader: 'Выберите фазу',
                        // balloonContentBody: 'Содержимое <em>балуна</em> метки',
                        // balloonContentFooter: 'Подвал',
                        hintContent: `${trafficLight.description}<br>` + `${trafficLight.tlsost.description}<br>` +
                            `[${trafficLight.region.num}, ${trafficLight.area.num}, ${trafficLight.ID}]`
                    }, {
                        iconLayout: createChipsLayout(function (zoom) {
                            // Размер метки будет определяться функией с оператором switch.
                            return calculate(zoom);
                        }, trafficLight.tlsost.num),
                    });
                    placemark.pos = {region: trafficLight.region.num, area: trafficLight.area.num, id: trafficLight.ID};
                    //Функция для вызова АРМ нажатием на контроллер
                    placemark.events.add('click', function () {
                        handlePlacemarkClick(map, trafficLight, placemark);
                    });
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);
                });
                // .append(new Option(regionInfo[reg], reg));
                break;
            case 'tflight':
                if (data.tflight === null) {
                    console.log('null');
                } else {
                    // console.log('Обновление');
                    //Обновление статуса контроллера происходит только при его изменении
                    data.tflight.forEach(trafficLight => {
                        let index = IDs.indexOf(getUniqueId(trafficLight));
                        //Создание меток контроллеров на карте
                        let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                            // balloonContent: 'Отсутсвует картинка перекрёстка',
                            hintContent: `${trafficLight.description}<br>` + `${trafficLight.tlsost.description}<br>` +
                                `[${trafficLight.region.num}, ${trafficLight.area.num}, ${trafficLight.ID}]`
                        }, {
                            iconLayout: createChipsLayout(function (zoom) {
                                // Размер метки будет определяться функией с оператором switch.
                                return calculate(zoom);
                            }, trafficLight.tlsost.num)
                        });
                        placemark.events.add('click', function () {
                            handlePlacemarkClick(map, trafficLight, placemark);
                        });

                        tflights.forEach((tflight, index) => {
                            if ((tflight.region.num === trafficLight.region.num) &&
                                (tflight.area.num === trafficLight.area.num) && (tflight.ID === trafficLight.ID)) {
                                tflights[index].tlsost = trafficLight.tlsost;
                            }
                        });

                        // Если открыто управление перекрёстком, замена объекта на карте произойдет по закрытию управления
                        if ((ideviceSave !== trafficLight.idevice) && (index !== -1)) {
                            //Замена метки контроллера со старым состоянием на метку с новым
                            map.geoObjects.splice(index, 1, placemark);
                        } else {
                            clearInterval(waiter);
                            waiter = setTimeout(() => {
                                if (ideviceSave === -1) {
                                    map.geoObjects.splice(index, 1, placemark);
                                    clearInterval(waiter);
                                }
                            }, 100);
                        }
                    })
                }
                break;
            case 'getBindings':
                data.tfLinks.forEach(link => {
                    const tflink = new tfLink();
                    tflink.copy(link.tflink);
                    tfLinksArray.push({id: link.id, tflink});
                });
                break;
            case 'updateBindings':
                tfLinksArray = [];
                data.tfLinks.forEach(link => {
                    const tflink = new tfLink();
                    tflink.copy(link.tflink);
                    tfLinksArray.push({id: link.id, tflink});
                });
                break;
            case 'repaint': {
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
                        // areaZone = data.areaZone;
                        // createAreasLayout(map);
                        clearInterval(execWaiter);
                    }
                }, 5000);
                break;
            }
            case 'phases':
                if (data.phases[0].phase === 9) return;
                $('#table tbody tr[style="background-color: lightgreen;"]').css({backgroundColor: 'white'})
                $(`#table tbody td:hidden:contains("${data.phases[0].phase}")`).parent().css({backgroundColor: 'lightgreen'})
                // console.log('phases', data)
                break;
            case 'getAddObjects':
                addObjectsArray = data.addObjects;
                data.addObjects.forEach(addObj => {
                    let placemark = new ymaps.Placemark(addObj.dgis, {
                        // balloonContentHeader: 'Выберите фазу',
                        // balloonContentBody: 'Содержимое <em>балуна</em> метки',
                        // balloonContentFooter: 'Подвал',
                        hintContent: `[${addObj.region}, ${addObj.area}, ${addObj.id}]<br>` + addObj.description
                    }, {
                        iconLayout: createChipsLayout(function (zoom) {
                            // Размер метки будет определяться функией с оператором switch.
                            return calculate(zoom);
                        }, 'testPoint'),
                    });
                    placemark.pos = addObj;
                    //Функция для вызова АРМ нажатием на контроллер
                    placemark.events.add('click', function (e) {
                        handleAddObjClick(e.originalEvent.target.pos);
                        console.log('testPoint click');
                        // handlePlacemarkClick(map, trafficLight, placemark);
                    });
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);
                })
                break;
            case 'createAddObj': {
                if (data.result) {
                    addObjectsArray.push(data.addObj);
                    const addObj = data.addObj;
                    let placemark = new ymaps.Placemark(addObj.dgis, {
                        // balloonContentHeader: 'Выберите фазу',
                        // balloonContentBody: 'Содержимое <em>балуна</em> метки',
                        // balloonContentFooter: 'Подвал',
                        hintContent: `[${addObj.region}, ${addObj.area}, ${addObj.id}]<br>` + addObj.description
                    }, {
                        iconLayout: createChipsLayout(function (zoom) {
                            // Размер метки будет определяться функией с оператором switch.
                            return calculate(zoom);
                        }, 'testPoint'),
                    });
                    placemark.pos = addObj;
                    //Функция для вызова АРМ нажатием на контроллер
                    placemark.events.add('click', function (e) {
                        handleAddObjClick(e.originalEvent.target.pos);
                        console.log('testPoint click');
                        // handlePlacemarkClick(map, trafficLight, placemark);
                    });
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);
                } else {
                    alert(data.msg)
                }
                break;
            }
            case 'deleteAddObj':
                if (data.result) {
                    map.geoObjects.each(el => {
                        if (el.pos !== undefined) {
                            if ((el.pos.region === data.addObj.region) &&
                                (el.pos.area === data.addObj.area) &&
                                (el.pos.id === data.addObj.id)) {
                                map.geoObjects.remove(el)
                            }
                        }
                    })
                } else {
                    alert('Не удалось удалить объект, обратитесь к администратору')
                }
                break;
            case 'jump':
                map.setBounds([
                    [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                    [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                ]);
                break;
            case 'error':
                closeReason = data.message;
                ws.close(1000);
                break;
            case 'close':
                closeReason = 'WS Closed by server';
                ws.close(1000);
                window.close();
                break;
            default:
                break;
        }
    };

    function handleAddObjDelete(pos) {
        if (confirm('Вы уверены? Объект будет безвозвратно удалён.')) {
            ws.send(JSON.stringify({type: 'deleteAddObj', data: pos}))
        }
    }

    function imitateTFLFromADdObj(addObj) {
        return {
            ID: addObj.id,
            area: {num: toString(addObj.area)},
            region: {num: toString(addObj.region)},
            description: addObj.description
        }
    }

    function handleAddObjClick(pos) {
        let returnFlag = false
        if (creatingMode) {
            handleAddObjDelete(pos);
        } else if (!executionFlag) {
            circlesMap.forEach((value, keyJson) => {
                const key = JSON.parse(keyJson);
                if ((key.region === pos.region) && (key.area === pos.area) && (key.id === pos.id)) {
                    deleteCircle(map, value, key, pos.description);
                    returnFlag = true;
                    // if (circlesMap.size === 0) {
                    //     $('#phaseTableButton')[0].hidden = true;
                    //     $('#createRouteButton')[0].disabled = true;
                    // }
                }
            });

            const index = routeTFLights.findIndex(tflight => JSON.stringify(tflight) === JSON.stringify(imitateTFLFromADdObj(pos)))
            if (index === -1) {
                routeTFLights.push(imitateTFLFromADdObj(pos))
            } else {
                routeTFLights.splice(index, 1)
            }

            if (returnFlag) return
            createCircle(pos.region, pos.area, pos.id, pos.description,
                [pos.dgis[0], pos.dgis[1]])
        }
    }

    //Выбор места для открытия на карте
    $('#locationButton').on('click', function () {
        $('#locationDialog').dialog('open');
    });

    //Выбор фрагмента для открытия на карте
    $('#fragmentButton').on('click', function () {
        makeFragmentSelect();
        $('#fragmentDialog').dialog('open');
    });

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

    $('#fragmentDialog').dialog({
        autoOpen: false,
        buttons: {
            'Открыть': function () {
                const [x1, y1, x2, y2] = $('#fragment')[0].value.split(',').map(el => Number(el));
                const bounds = [[x1, y1], [x2, y2]];
                map.setBounds(bounds);

                $(this).dialog('close');
            },
            'Открыть в новой вкладке': function () {
                const [x1, y1, x2, y2] = $('#fragment')[0].value.split(',').map(el => Number(el));
                const bounds = [[x1, y1], [x2, y2]];
                localStorage.setItem('fragment', JSON.stringify(bounds))
                window.open(location.href);
                $(this).dialog('close');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        minWidth: 480,
        modal: true,
        resizable: false
    });

    $('#creatingAddDialog').dialog({
        autoOpen: false,
        buttons: {
            'Создать': function () {
                if ($('#addId')[0].valueAsNumber < 10000) {
                    if ($('#id_err').length === 0) $('#addIdForm').append('<div id="id_err" style="color: red">Неверный ID</div>')
                } else {
                    $('#id_err').remove()
                }
                if ($('#addDesc').val().length === 0) {
                    if ($('#desc_err').length === 0) $('#addDescForm').append('<div id="desc_err" style="color: red">Пожалуйста, заполните поле</div>')
                } else {
                    $('#desc_err').remove()
                }

                if ($('div[id$="err"]').length !== 0) return;

                ws.send(JSON.stringify({
                        type: 'createAddObj',
                        data: {
                            region: Number($('#addRegion').val()),
                            area: Number($('#addArea').val()),
                            id: $('#addId')[0].valueAsNumber,
                            description: $('#addDesc').val(),
                            dgis: coordsSave
                        }
                    })
                )
                $(this).dialog('close');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        // minWidth: window.innerWidth * 0.9,
        // height: window.innerHeight * 0.9,
        modal: true,
        resizable: false
    });

    $('#tableDialog').dialog({
        autoOpen: false,
        buttons: {
            'Ок': function () {
                updateBindings();
                $(this).dialog('close');
            },
            'Отмена': function () {
                currentTfLink = new tfLink();
                currentTfId = '';
                $(this).dialog('close');
            }
        },
        minWidth: window.innerWidth * 0.9,
        // height: window.innerHeight * 0.9,
        modal: true,
        resizable: false
    });

    function makeFragmentSelect() {
        const fragmentSelect = $('#fragment');
        $('#fragment option').remove();
        if (fragments ?? false) {
            fragments.forEach(fragment => fragmentSelect.append(new Option(fragment.name, fragment.bounds)))
        } else {
            $('#fragment').append(new Option('Фрагменты отсутствуют', map.getBounds()))
        }
    }

    function validateTfLink() {
        const allValidFrom = Array.from($('td.from input')).map(input => input.value);
        Object.values(currentTfLink).forEach(cp => {
            if (cp.Id === '') {
                cp.WayPointsArray = [];
                return
            }
            const deleteIndexes = []
            cp.WayPointsArray?.forEach((wp, i) => {
                if ((!allValidFrom.some(from => from === wp.Id)) || (cp.Id === wp.Id)) {
                    deleteIndexes.push(i)
                }
            })
            deleteIndexes.sort((a, b) => b - a).forEach(del => cp.WayPointsArray.splice(del, 1))
        })
    }

    function updateBindings() {
        validateTfLink();
        let copyLink = new tfLink();
        copyLink.copy(currentTfLink);
        if (tfLinksArray.some(tfl => tfl.id === currentTfId)) {
            tfLinksArray.find(tfl => tfl.id === currentTfId).tflink = copyLink
        } else {
            tfLinksArray.push({id: currentTfId, tflink: copyLink});
        }
        ws.send(JSON.stringify({type: 'updateBindings', data: {id: currentTfId, tflink: copyLink}}));
        currentTfLink = new tfLink();
        currentTfId = '';
    }

    function getPhasesSvg(trafficLight) {
        return new Promise(function (resolve) {
            $.ajax({
                url: window.location.origin + '/file/static/cross/' + trafficLight.region.num + '/' + trafficLight.area.num + '/' + trafficLight.ID + '/cross.svg',
                type: 'GET',
                success: function (svgData) {
                    // todo Жду обновлённые картинки от Андрея
                    // let x2js = new X2JS();
                    // let data = x2js.xml2json(svgData);
                    // svg.push(data.svg.mphase.phase)

                    $('#svgContainer').html(svgData.children[0].outerHTML.replace('let currentPhase', 'var currentPhase'));
                    const uniqueId = trafficLight.region.num + '/' + trafficLight.area.num + '/' + trafficLight.ID;
                    if (typeof getPhasesMass === "function") {
                        svg[uniqueId] = getPhasesMass()
                        resolve(true);
                    } else {
                        svg[uniqueId] = [];
                        resolve(false);
                    }
                },
                error: function (request) {
                    console.log(request.status + ' ' + request.responseText);
                    alert(JSON.parse(request.responseText).message);
                    resolve(false);
                }
            });
        })
    }

    function makeSelects(trafficLight) {
        $('td.phase').each((i, td) => {
            let optionsHTML = '';
            $(td).empty();
            trafficLight.phases.forEach(phase => {
                optionsHTML += `<option value="${phase}">${phase}</option>`;
            });
            $($('td.to')[i]).find('div').each((j, val) => {
                $(td).append(`<select id="phase${i}-${j}">${optionsHTML}</select>`)

                let phase = 1;
                if (tfLinksArray.some(tfl => tfl.id === getUniqueId(trafficLight))) {
                    const tfl = tfLinksArray.find(tflink => tflink.id === getUniqueId(trafficLight)).tflink;
                    phase = getPhase(tfl[directions[i].en].Id, getUniqueId(trafficLight), $($('td.to')[i]).find('div')[j].innerText) ?? 1
                }
                const wayPointsArr = currentTfLink[directions[i].en].WayPointsArray ?? [];
                if (wayPointsArr.some(wp => wp.Id === val.innerText)) {
                    const currIndex = wayPointsArr.findIndex(wp => wp.Id === val.innerText)
                    wayPointsArr[currIndex] = new wayPoint(val.innerText, phase.toString())
                } else {
                    wayPointsArr.push(new wayPoint(val.innerText, phase.toString()))
                }
                $(`#phase${i}-${j}`).val(phase).on('change', () => handleSelectChange(i, j));
            })
        })
    }

    function handleSelectChange(row, index) {
        const value = $(`#phase${row}-${index}`).val();
        const currDir = directions[row].en;
        const to = $($('td.to')[row]).find('div')[index].innerText;
        currentTfLink[currDir].WayPointsArray.find(wp => wp.Id === to).phase = value;
    }

    function fillPhases(trafficLight) {
        $('#phaseContainer').empty()
        let currSvg = svg[trafficLight.region.num + '/' + trafficLight.area.num + '/' + trafficLight.ID];
        let width = $('#phaseContainer').width() / 3;

        for (let i = 0; i <= Math.floor((currSvg.length - 1) / 4); i++) {
            $('#phaseContainer').append(`<div id="miniContainer${i}" 
                style="width: ${100 / (Math.floor((currSvg.length - 1) / 4))}%"></div>`)
        }

        currSvg.forEach((phaseSvg, i) => {
            let containerIndex = Math.floor(i / 4)
            $('#miniContainer' + containerIndex).append(
                `<div class="text-center m-1" style="display: inline-flex;">` +
                `<h2 class="my-auto">${phaseSvg.num}</h2>` +
                `<svg width="100%" height="100%" ` +
                `style="background-color: white; ` +
                `max-height: ${width}px; max-width: ${width}px;" xmlns="http://www.w3.org/2000/svg" ` +
                `xmlns:xlink="http://www.w3.org/1999/xlink"> ` +
                `<image x="0" y="0" width="100%" height="100%" ` +
                `style="max-height: ${width}px; max-width: ${width}px;" ` +
                `xlink:href="data:image/png;base64,${phaseSvg.phase}"></image>` +
                `</svg>` +
                `</div>`
            )
        })

        $('#table').trigger('resize');
        $($('.ui-dialog')[3]).css({top: ((window.innerHeight - $('.ui-dialog')[3].offsetHeight) / 2)})
    }

    function handlePlacemarkClick(map, trafficLight) {
        console.log(map, trafficLight);
        let returnFlag = false
        if (creatingMode) {
            $('#tableDialog').dialog('open');
            getPhasesSvg(trafficLight).then(
                (success) => {
                    if (success) fillPhases(trafficLight)
                }
            )
            fillTable(trafficLight);
            currentTfId = getUniqueId(trafficLight);
            $('.ui-dialog-title')[1].innerText = trafficLight.description
        } else if (executionFlag) {
            console.log("send phase")
        } else {
            circlesMap.forEach((value, keyJson) => {
                const key = JSON.parse(keyJson);
                if ((key.region === trafficLight.region.num) && (key.area === trafficLight.area.num) && (key.id === trafficLight.ID)) {
                    deleteCircle(map, value, key, trafficLight.description);
                    returnFlag = true;
                    // if (circlesMap.size === 0) {
                    //     $('#phaseTableButton')[0].hidden = true;
                    //     $('#createRouteButton')[0].disabled = true;
                    // }
                }
            });
            console.log('click');

            const index = routeTFLights.findIndex(tflight => JSON.stringify(tflight) === JSON.stringify(trafficLight))
            if (index === -1) {
                routeTFLights.push(trafficLight)
            } else {
                routeTFLights.splice(index, 1)
            }

            if (returnFlag) return
            createCircle(trafficLight.region.num, trafficLight.area.num, trafficLight.ID, trafficLight.description,
                [trafficLight.points.Y, trafficLight.points.X])
        }
        // Команда на влкючение передачи фаз
        // controlSend(trafficLight.idevice, 4, 1)
        // ideviceSave = trafficLight.idevice;
        // $.ajax({
        //     url: window.location.origin + '/file/static/cross/' + trafficLight.region.num + '/' + trafficLight.area.num + '/' + trafficLight.ID + '/cross.svg',
        //     type: 'GET',
        //     success: function () {
        //         let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
        //             // balloonContentHeader: 'Выберите фазу',
        //             balloonContentBody: 'BALLOON CONTENT',
        //             // balloonContentFooter: 'Подвал',svgData.children[0].outerHTML
        //             hintContent: trafficLight.description
        //         }, {
        //             iconLayout: createChipsLayout(function (zoom) {
        //                 // Размер метки будет определяться функией с оператором switch.
        //                 return calculate(zoom);
        //             }, trafficLight.tlsost.num),
        //         });
        //         placemark.pos = {region: trafficLight.region.num, area: trafficLight.area.num, id: trafficLight.ID};
        //         //Функция для вызова АРМ нажатием на контроллер
        //         placemark.events.add('click', function () {
        //             handlePlacemarkClick(map, trafficLight, placemark);
        //         });
        //         placemark.events.add('balloonclose', function () {
        //             // Выключение передачи фаз предыдущего перекрёстка
        //             ideviceSave = -1;
        //         });
        //         placemark.events.add('balloonopen', function () {
        //             // Выключение передачи фаз предыдущего перекрёстка
        //             controlSend(trafficLight.idevice, 4, 1);
        //             ideviceSave = trafficLight.idevice;
        //         });
        //         //Добавление метки контроллера на карту
        //         // map.geoObjects.add(placemark);
        //
        //         try {
        //             map.geoObjects.splice(map.geoObjects.indexOf(oldplacemark), 1, placemark);
        //             placemark.balloon.open();
        //         } catch (e) {
        //             console.log('error', e.message);
        //             // handlePlacemarkClick(map, trafficLight, oldplacemark);
        //             return;
        //         }
        //
        //         // placemark.balloon.open().then(() => $('#table').parent().parent().width('').height(''));
        //     },
        //     error: function (request) {
        //         console.log(request.status + ' ' + request.responseText);
        //         alert(JSON.parse(request.responseText).message);
        //     }
        // });
    }

    const directions = [{en: 'West', ru: 'З'}, {en: 'North', ru: 'С'}, {en: 'East', ru: 'В'}, {en: 'South', ru: 'Ю'}];
    const directionsStr = 'ЮВСЗ';

    function makeToInputs(trafficLight) {
        $('td.from').each((i, td) => {
            if ($(td).find("input").val() === '') {
                $('td.to')[i].innerHTML = '';
                return;
            }
            const otherDirs = directions.filter(dir => dir.ru !== directions[i].ru);
            let otherValues = [];
            otherDirs.forEach(dir => {
                if ((currentTfLink[dir.en].Id !== '') && (currentTfLink[dir.en].Id ?? false)) {
                    otherValues.push({dir: dir.ru, id: currentTfLink[dir.en].Id});
                }
            })

            const part1 = directionsStr.slice(0, directionsStr.indexOf(directions[i].ru))
            const part2 = directionsStr.slice(directionsStr.indexOf(directions[i].ru) + 1, directionsStr.length)
            const part = Array.from(part2 + part1);

            otherValues = otherValues.sort((val1, val2) => {
                return part.indexOf(val1.dir) - part.indexOf(val2.dir)
            })

            if (currentTfLink[directions[i].en].WayPointsArray === undefined) currentTfLink[directions[i].en].WayPointsArray = [];
            let toHTML = '';
            otherValues.forEach(val => {
                toHTML += `<div>${val.id}</div>`;
            })
            $('td.to')[i].innerHTML = toHTML;
        })
        makeSelects(trafficLight)
        $('#table').trigger('resize');
    }

    function handleFromInputKeyup(trafficLight, index, evt) {
        currentTfLink[directions[index].en].Id = evt.currentTarget.value;
        $('#' + directions[index].en).text(evt.currentTarget.value);
        makeToInputs(trafficLight);
    }

    function fillTable(trafficLight) {
        const initialState = [];
        directions.forEach(dir => {
            initialState.push({
                direction: dir.ru,
            });
            $('#' + dir.en).text(dir.ru);
        })

        $('#table').bootstrapTable('load', initialState);
        $('.fixed-table-container').prop('style', '');
        $('.fixed-table-toolbar').remove();
        $('td.from').each((i, td) => {
            $(td).html(`<input type="text" class="form-control mx-auto text-center" id="from${i}" required="" ` +
                'style="max-width: 120px;">');
            $(td).find('input').on('keyup', (evt) => handleFromInputKeyup(trafficLight, i, evt))
        })

        if (tfLinksArray.some(tfl => tfl.id === getUniqueId(trafficLight))) {
            const tfl = tfLinksArray.find(tflink => tflink.id === getUniqueId(trafficLight)).tflink;
            currentTfLink = new tfLink();
            currentTfLink.copy(tfl);
            directions.forEach((dir, index) => {
                $('td.from input')[index].value = (tfl[dir.en]?.Id) ?? ''
            })
            makeToInputs(trafficLight);
            // $('td.from input').trigger('keyup');
        }
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
})

//Отправка выбранной команды на сервер
function controlSend(idevice, cmd, num) {
    ws.send(JSON.stringify({type: 'dispatch', id: idevice, cmd: cmd, param: num}));
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
//		          case 11:
//		            return 5;
//		          case 12:
//		            return 10;
//		          case 13:
//		            return 20;
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
            return 25;
        // return 80;
    }
};

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